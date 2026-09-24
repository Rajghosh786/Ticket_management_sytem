import mongoose from "mongoose";
import { SLA_POLICY, TICKET_CATEGORIES, TICKET_PRIORITIES } from "../constants/sla.policy.js";
import { Ticket } from "../models/Ticket.js";
import { User } from "../models/User.js";
import { createAuditLog, getAuditLogsForTicket } from "../services/audit.service.js";
import { enrichTicketTiming } from "../services/sla.service.js";
import {
    processSlaBreachForTicketId,
    processSlaBreachesForQuery,
} from "../services/sla.breach.service.js";
import { generateTicketId } from "../utils/ticketId.util.js";

const REOPEN_WINDOW_MS = 48 * 60 * 60 * 1000;

// Allowed staff-initiated status transitions
const STAFF_ALLOWED_TRANSITIONS = {
    OPEN: ["IN_PROGRESS"],
    IN_PROGRESS: ["PENDING_STUDENT_ACTION", "RESOLVED"],
    REOPENED: ["IN_PROGRESS"],
};

function buildStudentSummary(tickets) {
    const activeStatuses = new Set(["OPEN", "IN_PROGRESS", "PENDING_STUDENT_ACTION", "REOPENED"]);

    return {
        activeTickets: tickets.filter((ticket) => activeStatuses.has(ticket.status)).length,
        pendingAction: tickets.filter((ticket) => ticket.status === "PENDING_STUDENT_ACTION").length,
        resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
        closed: tickets.filter((ticket) => ticket.status === "CLOSED").length,
    };
}

function buildTicketQueryForUser(user) {
    if (user.role === "STUDENT") {
        return { studentId: user._id };
    }

    if (user.role === "STAFF" || user.role === "DEPARTMENT_ADMIN") {
        return { department: user.department };
    }

    if (user.role === "ADMIN") {
        return {};
    }

    return { studentId: user._id };
}

function applyTicketFilters(baseQuery, queryParams, user) {
    const query = { ...baseQuery };

    if (queryParams.department && user?.role === "ADMIN") {
        query.department = String(queryParams.department);
    }

    if (queryParams.status) {
        query.status = String(queryParams.status).toUpperCase();
    }

    if (queryParams.category) {
        query.category = String(queryParams.category).toUpperCase();
    }

    if (queryParams.priority) {
        query.priority = String(queryParams.priority).toUpperCase();
    }

    if (queryParams.assignedTo) {
        // "me" and "unassigned" are handled after this call
        if (queryParams.assignedTo !== "me" && queryParams.assignedTo !== "unassigned") {
            query.assignedTo = queryParams.assignedTo;
        }
    }

    if (queryParams.search) {
        const search = String(queryParams.search).trim();
        query.$or = [
            { ticketId: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    return query;
}

function getTicketStudentId(ticket) {
    if (!ticket?.studentId) {
        return null;
    }

    if (typeof ticket.studentId === "object" && ticket.studentId._id) {
        return String(ticket.studentId._id);
    }

    return String(ticket.studentId);
}

async function canUserAccessTicket(user, ticket) {
    if (user.role === "ADMIN") {
        return true;
    }

    if (user.role === "STUDENT") {
        return getTicketStudentId(ticket) === String(user._id);
    }

    if (user.role === "STAFF" || user.role === "DEPARTMENT_ADMIN") {
        return ticket.department === user.department;
    }

    return false;
}

function formatAuditLogs(auditLogs) {
    return auditLogs.map((entry) => ({
        _id: entry._id,
        action: entry.action,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        details: entry.details,
        timestamp: entry.timestamp,
        performedBy: entry.performedBy
            ? {
                  _id: entry.performedBy._id,
                  name: entry.performedBy.name,
                  role: entry.performedBy.role,
              }
            : null,
    }));
}

function validateCreateInput(body) {
    const errors = [];

    if (!body.category || !TICKET_CATEGORIES.includes(String(body.category).toUpperCase())) {
        errors.push("Valid category is required");
    }

    if (!body.title || !String(body.title).trim()) {
        errors.push("Title is required");
    }

    if (!body.description || !String(body.description).trim()) {
        errors.push("Description is required");
    }

    return errors;
}

export async function createTicket(req, res) {
    try {
        const validationErrors = validateCreateInput(req.body);

        if (validationErrors.length > 0) {
            return res.status(400).json({ message: validationErrors.join(". ") });
        }

        const { category, title, description } = req.body;
        const normalizedCategory = String(category).toUpperCase();
        // Backend always assigns MEDIUM priority — students do not choose priority
        const normalizedPriority = "MEDIUM";
        const policy = SLA_POLICY[normalizedCategory];
        const now = new Date();
        const slaDeadline = new Date(now.getTime() + policy.hours * 60 * 60 * 1000);
        const ticketId = await generateTicketId();

        const ticket = await Ticket.create({
            ticketId,
            studentId: req.user._id,
            studentName: req.user.name,
            category: normalizedCategory,
            title: String(title).trim(),
            description: String(description).trim(),
            priority: normalizedPriority,
            status: "OPEN",
            department: policy.department,
            slaHours: policy.hours,
            slaDeadline,
            isBreached: false,
            slaStatus: "WITHIN_SLA",
        });

        await createAuditLog({
            ticketId: ticket._id,
            action: "TICKET_CREATED",
            performedBy: req.user._id,
            fromStatus: "",
            toStatus: "OPEN",
            details: `Ticket ${ticket.ticketId} created`,
        });

        const enriched = enrichTicketTiming(ticket);
        return res.status(201).json({ ticket: enriched });
    } catch (error) {
        console.error("Create ticket error:", error);
        return res.status(500).json({ message: "Unable to create ticket" });
    }
}

export async function getTickets(req, res) {
    try {
        const roleQuery = buildTicketQueryForUser(req.user);
        const query = applyTicketFilters(roleQuery, req.query, req.user);

        // Handle special assignedTo filter values
        if (req.query.assignedTo === "me") {
            query.assignedTo = req.user._id;
        } else if (req.query.assignedTo === "unassigned") {
            query.assignedTo = null;
        }

        await processSlaBreachesForQuery(query, req.user._id);

        const tickets = await Ticket.find(query)
            .populate("assignedTo", "name role department")
            .sort({ updatedAt: -1 })
            .lean();

        let enrichedTickets = tickets.map((ticket) => enrichTicketTiming(ticket));

        if (req.query.slaStatus) {
            const slaFilter = String(req.query.slaStatus).toUpperCase();
            enrichedTickets = enrichedTickets.filter((ticket) => ticket.slaStatus === slaFilter);
        }

        if (req.query.breached === "true") {
            enrichedTickets = enrichedTickets.filter(
                (ticket) => ticket.isBreached || ticket.slaStatus === "BREACHED"
            );
        }

        if (req.user.role === "STUDENT") {
            return res.status(200).json({
                tickets: enrichedTickets,
                summary: buildStudentSummary(enrichedTickets),
            });
        }

        return res.status(200).json({ tickets: enrichedTickets });
    } catch (error) {
        console.error("Get tickets error:", error);
        return res.status(500).json({ message: "Unable to load tickets" });
    }
}

export async function getTicketById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ticket id" });
        }

        await processSlaBreachForTicketId(id, req.user._id);

        const ticket = await Ticket.findById(id)
            .populate("assignedTo", "name role department")
            .populate("studentId", "name email rollNo")
            .lean();

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const allowed = await canUserAccessTicket(req.user, ticket);
        if (!allowed) {
            return res.status(403).json({ message: "You do not have access to this ticket" });
        }

        const auditHistory = await getAuditLogsForTicket(ticket._id);
        const enriched = enrichTicketTiming(ticket);

        return res.status(200).json({
            ticket: enriched,
            auditHistory: formatAuditLogs(auditHistory),
        });
    } catch (error) {
        console.error("Get ticket by id error:", error);
        return res.status(500).json({ message: "Unable to load ticket details" });
    }
}

export async function closeTicket(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ticket id" });
        }

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (String(ticket.studentId) !== String(req.user._id)) {
            return res.status(403).json({ message: "You can only close your own tickets" });
        }

        if (ticket.status !== "RESOLVED") {
            return res.status(400).json({
                message: "Only resolved tickets can be closed",
            });
        }

        const fromStatus = ticket.status;
        ticket.status = "CLOSED";
        ticket.closedAt = new Date();
        await ticket.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "TICKET_CLOSED",
            performedBy: req.user._id,
            fromStatus,
            toStatus: "CLOSED",
            details: "Student confirmed resolution and closed the ticket",
        });

        const enriched = enrichTicketTiming(ticket);
        return res.status(200).json({ ticket: enriched });
    } catch (error) {
        console.error("Close ticket error:", error);
        return res.status(500).json({ message: "Unable to close ticket" });
    }
}

export async function reopenTicket(req, res) {
    try {
        const { id } = req.params;
        const { reopenReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ticket id" });
        }

        if (!reopenReason || !String(reopenReason).trim()) {
            return res.status(400).json({ message: "Reopen reason is required" });
        }

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (String(ticket.studentId) !== String(req.user._id)) {
            return res.status(403).json({ message: "You can only reopen your own tickets" });
        }

        if (ticket.status !== "CLOSED") {
            return res.status(400).json({
                message: "Only closed tickets can be reopened",
            });
        }

        const referenceTime = ticket.closedAt || ticket.resolvedAt;
        if (!referenceTime) {
            return res.status(400).json({ message: "Ticket is not eligible for reopen" });
        }

        const elapsedMs = Date.now() - new Date(referenceTime).getTime();
        if (elapsedMs > REOPEN_WINDOW_MS) {
            return res.status(400).json({
                message: "Reopen window has expired. Tickets can only be reopened within 48 hours of closure.",
            });
        }

        const fromStatus = ticket.status;
        ticket.status = "REOPENED";
        ticket.reopenedAt = new Date();
        ticket.reopenReason = String(reopenReason).trim();
        await ticket.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "TICKET_REOPENED",
            performedBy: req.user._id,
            fromStatus,
            toStatus: "REOPENED",
            details: ticket.reopenReason,
        });

        const enriched = enrichTicketTiming(ticket);
        return res.status(200).json({ ticket: enriched });
    } catch (error) {
        console.error("Reopen ticket error:", error);
        return res.status(500).json({ message: "Unable to reopen ticket" });
    }
}

export async function respondToPendingAction(req, res) {
    try {
        const { id } = req.params;
        const { response } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ticket id" });
        }

        if (!response || !String(response).trim()) {
            return res.status(400).json({ message: "A response is required" });
        }

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (String(ticket.studentId) !== String(req.user._id)) {
            return res.status(403).json({ message: "You can only respond to your own tickets" });
        }

        if (ticket.status !== "PENDING_STUDENT_ACTION") {
            return res.status(400).json({
                message: "This ticket is not waiting for student action",
            });
        }

        const fromStatus = ticket.status;

        if (ticket.slaPausedAt) {
            const pausedDuration = Date.now() - new Date(ticket.slaPausedAt).getTime();
            ticket.totalPausedDuration = (ticket.totalPausedDuration || 0) + pausedDuration;
            ticket.slaPausedAt = null;
        }

        ticket.status = "IN_PROGRESS";
        await ticket.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "STUDENT_RESPONDED",
            performedBy: req.user._id,
            fromStatus,
            toStatus: "IN_PROGRESS",
            details: String(response).trim(),
        });

        const enriched = enrichTicketTiming(ticket);
        return res.status(200).json({ ticket: enriched });
    } catch (error) {
        console.error("Student respond error:", error);
        return res.status(500).json({ message: "Unable to submit response" });
    }
}

// ---- STAFF WORKFLOW CONTROLLERS ----

export async function changeTicketStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, resolutionNotes, staffQuery } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ticket id" });
        }

        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const newStatus = String(status).toUpperCase();

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // Enforce department-level authorization on backend
        if (ticket.department !== req.user.department) {
            return res.status(403).json({ message: "You do not have access to this ticket" });
        }

        // Validate allowed transitions for staff
        const allowedNext = STAFF_ALLOWED_TRANSITIONS[ticket.status] || [];
        if (!allowedNext.includes(newStatus)) {
            return res.status(400).json({
                message: `Cannot transition from ${ticket.status} to ${newStatus}`,
            });
        }

        // Resolution requires notes
        if (newStatus === "RESOLVED") {
            if (!resolutionNotes || !String(resolutionNotes).trim()) {
                return res.status(400).json({ message: "Resolution notes are required to resolve a ticket" });
            }
        }

        // Pending student action requires a query message
        if (newStatus === "PENDING_STUDENT_ACTION") {
            if (!staffQuery || !String(staffQuery).trim()) {
                return res.status(400).json({ message: "A query message is required when requesting student action" });
            }
        }

        const fromStatus = ticket.status;
        ticket.status = newStatus;

        if (newStatus === "PENDING_STUDENT_ACTION") {
            ticket.slaPausedAt = new Date();
            ticket.staffQuery = String(staffQuery).trim();
        }

        if (newStatus === "RESOLVED") {
            ticket.resolutionNotes = String(resolutionNotes).trim();
            ticket.resolvedAt = new Date();
        }

        await ticket.save();

        let auditAction = "STATUS_CHANGED";
        let auditDetails = `Status changed from ${fromStatus} to ${newStatus}`;

        if (newStatus === "PENDING_STUDENT_ACTION") {
            auditAction = "PENDING_STUDENT_ACTION";
            auditDetails = ticket.staffQuery;
        } else if (newStatus === "RESOLVED") {
            auditAction = "TICKET_RESOLVED";
            auditDetails = ticket.resolutionNotes;
        }

        await createAuditLog({
            ticketId: ticket._id,
            action: auditAction,
            performedBy: req.user._id,
            fromStatus,
            toStatus: newStatus,
            details: auditDetails,
        });

        const enriched = enrichTicketTiming(ticket);
        return res.status(200).json({ ticket: enriched });
    } catch (error) {
        console.error("Change status error:", error);
        return res.status(500).json({ message: "Unable to update ticket status" });
    }
}

export async function changeTicketPriority(req, res) {
    try {
        const { id } = req.params;
        const { priority } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ticket id" });
        }

        if (!priority || !TICKET_PRIORITIES.includes(String(priority).toUpperCase())) {
            return res.status(400).json({ message: "Valid priority is required (LOW, MEDIUM, HIGH, CRITICAL)" });
        }

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (req.user.role === "STAFF" || req.user.role === "DEPARTMENT_ADMIN") {
            if (ticket.department !== req.user.department) {
                return res.status(403).json({ message: "You do not have access to this ticket" });
            }
        } else {
            return res.status(403).json({ message: "You do not have permission to change ticket priority" });
        }

        const oldPriority = ticket.priority;
        const newPriority = String(priority).toUpperCase();

        if (oldPriority === newPriority) {
            return res.status(400).json({ message: "Ticket already has this priority" });
        }

        const activeStatuses = new Set(["OPEN", "IN_PROGRESS", "PENDING_STUDENT_ACTION", "REOPENED"]);
        if (ticket.isBreached && activeStatuses.has(ticket.status) && newPriority !== "CRITICAL") {
            return res.status(400).json({
                message: "Breached tickets must remain CRITICAL until resolved or closed",
            });
        }

        ticket.priority = newPriority;
        await ticket.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "PRIORITY_CHANGED",
            performedBy: req.user._id,
            fromStatus: ticket.status,
            toStatus: ticket.status,
            details: `Priority changed from ${oldPriority} to ${newPriority}`,
        });

        const enriched = enrichTicketTiming(ticket);
        return res.status(200).json({ ticket: enriched });
    } catch (error) {
        console.error("Change priority error:", error);
        return res.status(500).json({ message: "Unable to update ticket priority" });
    }
}

export async function takeTicket(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ticket id" });
        }

        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // Enforce department-level authorization on backend
        if (ticket.department !== req.user.department) {
            return res.status(403).json({ message: "You do not have access to this ticket" });
        }

        // Conditional update ensures only one staff can claim the same unassigned ticket at a time
        const updated = await Ticket.findOneAndUpdate(
            { _id: ticket._id, assignedTo: null },
            { assignedTo: req.user._id },
            { new: true }
        ).populate("assignedTo", "name role department");

        if (!updated) {
            return res.status(409).json({ message: "This ticket has already been claimed by another staff member" });
        }

        await createAuditLog({
            ticketId: updated._id,
            action: "ASSIGNED_TO_STAFF",
            performedBy: req.user._id,
            fromStatus: updated.status,
            toStatus: updated.status,
            details: `Ticket self-assigned by ${req.user.name}`,
        });

        const enriched = enrichTicketTiming(updated);
        return res.status(200).json({ ticket: enriched });
    } catch (error) {
        console.error("Take ticket error:", error);
        return res.status(500).json({ message: "Unable to take ticket" });
    }
}

export async function assignTicket(req, res) {
    try {
        const { id } = req.params;
        const { assignedTo } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ticket id" });
        }

        if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
            return res.status(400).json({ message: "Valid staff member is required" });
        }

        const staffMember = await User.findById(assignedTo).select("name role department");

        if (!staffMember || staffMember.role !== "STAFF") {
            return res.status(400).json({ message: "Selected user is not a staff member" });
        }

        if (staffMember.department !== req.user.department) {
            return res.status(403).json({ message: "Staff member must belong to your department" });
        }

        const existingTicket = await Ticket.findById(id).populate("assignedTo", "name");

        if (!existingTicket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (existingTicket.department !== req.user.department) {
            return res.status(403).json({ message: "You do not have access to this ticket" });
        }

        const previousAssigneeName = existingTicket.assignedTo?.name || "Unassigned";

        if (existingTicket.assignedTo && String(existingTicket.assignedTo._id) === String(staffMember._id)) {
            return res.status(400).json({ message: "Ticket is already assigned to this staff member" });
        }

        const updated = await Ticket.findOneAndUpdate(
            { _id: id, department: req.user.department },
            { assignedTo: staffMember._id },
            { new: true }
        ).populate("assignedTo", "name role department");

        if (!updated) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        await createAuditLog({
            ticketId: updated._id,
            action: "ASSIGNED_TO_STAFF",
            performedBy: req.user._id,
            fromStatus: updated.status,
            toStatus: updated.status,
            details: `${previousAssigneeName} → ${staffMember.name}`,
        });

        const enriched = enrichTicketTiming(updated);
        return res.status(200).json({ ticket: enriched });
    } catch (error) {
        console.error("Assign ticket error:", error);
        return res.status(500).json({ message: "Unable to assign ticket" });
    }
}

export async function getDepartmentAdminKpis(req, res) {
    try {
        const department = req.user.department;
        const activeStatuses = ["OPEN", "IN_PROGRESS", "PENDING_STUDENT_ACTION", "REOPENED"];

        const [totalActive, unassigned, pendingStudentAction, inProgress, resolved, breached] =
            await Promise.all([
                Ticket.countDocuments({ department, status: { $in: activeStatuses } }),
                Ticket.countDocuments({
                    department,
                    assignedTo: null,
                    status: { $in: activeStatuses },
                }),
                Ticket.countDocuments({ department, status: "PENDING_STUDENT_ACTION" }),
                Ticket.countDocuments({
                    department,
                    status: { $in: ["IN_PROGRESS", "REOPENED"] },
                }),
                Ticket.countDocuments({ department, status: "RESOLVED" }),
                Ticket.countDocuments({
                    department,
                    isBreached: true,
                    status: { $in: activeStatuses },
                }),
            ]);

        return res.status(200).json({
            totalActive,
            unassigned,
            pendingStudentAction,
            inProgress,
            resolved,
            breached,
        });
    } catch (error) {
        console.error("Department admin KPI error:", error);
        return res.status(500).json({ message: "Unable to load KPIs" });
    }
}

export async function getStaffKpis(req, res) {
    try {
        const department = req.user.department;
        const activeStatuses = ["OPEN", "IN_PROGRESS", "PENDING_STUDENT_ACTION", "REOPENED"];

        const [activeTickets, pendingStudentAction, resolved, breached] = await Promise.all([
            Ticket.countDocuments({ department, status: { $in: activeStatuses } }),
            Ticket.countDocuments({ department, status: "PENDING_STUDENT_ACTION" }),
            Ticket.countDocuments({ department, status: "RESOLVED" }),
            Ticket.countDocuments({ department, isBreached: true, status: { $in: activeStatuses } }),
        ]);

        return res.status(200).json({
            activeTickets,
            pendingStudentAction,
            resolved,
            breached,
        });
    } catch (error) {
        console.error("Staff KPI error:", error);
        return res.status(500).json({ message: "Unable to load KPIs" });
    }
}

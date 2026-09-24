import mongoose from "mongoose";
import { SLA_POLICY, TICKET_CATEGORIES, TICKET_PRIORITIES } from "../constants/sla.policy.js";
import { Ticket } from "../models/Ticket.js";
import { createAuditLog, getAuditLogsForTicket } from "../services/audit.service.js";
import { enrichTicketTiming } from "../services/sla.service.js";
import { generateTicketId } from "../utils/ticketId.util.js";

const REOPEN_WINDOW_MS = 48 * 60 * 60 * 1000;

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

function applyTicketFilters(baseQuery, queryParams) {
    const query = { ...baseQuery };

    if (queryParams.status) {
        query.status = String(queryParams.status).toUpperCase();
    }

    if (queryParams.category) {
        query.category = String(queryParams.category).toUpperCase();
    }

    if (queryParams.priority) {
        query.priority = String(queryParams.priority).toUpperCase();
    }

    if (queryParams.slaStatus) {
        query.slaStatus = String(queryParams.slaStatus).toUpperCase();
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

    if (!body.priority || !TICKET_PRIORITIES.includes(String(body.priority).toUpperCase())) {
        errors.push("Valid priority is required");
    }

    return errors;
}

export async function createTicket(req, res) {
    try {
        const validationErrors = validateCreateInput(req.body);

        if (validationErrors.length > 0) {
            return res.status(400).json({ message: validationErrors.join(". ") });
        }

        const { category, title, description, priority } = req.body;
        const normalizedCategory = String(category).toUpperCase();
        const normalizedPriority = String(priority).toUpperCase();
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
        const query = applyTicketFilters(roleQuery, req.query);

        const tickets = await Ticket.find(query)
            .populate("assignedTo", "name role department")
            .sort({ updatedAt: -1 })
            .lean();

        const enrichedTickets = tickets.map((ticket) => enrichTicketTiming(ticket));

        if (req.user.role === "STUDENT") {
            if (req.query.slaStatus) {
                const slaFilter = String(req.query.slaStatus).toUpperCase();
                const filtered = enrichedTickets.filter((ticket) => ticket.slaStatus === slaFilter);
                return res.status(200).json({
                    tickets: filtered,
                    summary: buildStudentSummary(filtered),
                });
            }

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

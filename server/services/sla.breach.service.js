import { Ticket } from "../models/Ticket.js";
import { User } from "../models/User.js";
import { createAuditLog } from "./audit.service.js";
import { getEffectiveSlaDeadlineMs } from "./sla.service.js";

const TERMINAL_STATUSES = new Set(["RESOLVED", "CLOSED"]);

const BREACH_AUDIT_DETAILS =
    "SLA deadline passed and ticket was escalated to CRITICAL.";

let cachedBreachActorId = null;

async function resolveBreachActorId(requestUserId) {
    if (requestUserId) {
        return requestUserId;
    }

    if (cachedBreachActorId) {
        return cachedBreachActorId;
    }

    const adminUser = await User.findOne({ role: "ADMIN" }).select("_id").lean();
    cachedBreachActorId = adminUser?._id || null;
    return cachedBreachActorId;
}

export async function processSlaBreachForTicketId(ticketId, requestUserId) {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket || TERMINAL_STATUSES.has(ticket.status)) {
        return;
    }

    // Waiting on the student does not consume SLA time.
    if (ticket.status === "PENDING_STUDENT_ACTION" || ticket.slaPausedAt) {
        return;
    }

    const now = Date.now();
    const effectiveDeadlineMs = getEffectiveSlaDeadlineMs(ticket);

    if (now <= effectiveDeadlineMs) {
        return;
    }

    if (ticket.isBreached) {
        if (ticket.priority !== "CRITICAL" || ticket.slaStatus !== "BREACHED") {
            ticket.priority = "CRITICAL";
            ticket.slaStatus = "BREACHED";
            await ticket.save();
        }
        return;
    }

    const actorId = await resolveBreachActorId(requestUserId);
    if (!actorId) {
        return;
    }

    const updated = await Ticket.findOneAndUpdate(
        {
            _id: ticketId,
            isBreached: false,
            status: { $nin: ["RESOLVED", "CLOSED"] },
        },
        {
            $set: {
                isBreached: true,
                priority: "CRITICAL",
                slaStatus: "BREACHED",
            },
        },
        { new: true }
    );

    if (!updated) {
        return;
    }

    await createAuditLog({
        ticketId: updated._id,
        action: "SLA_BREACHED",
        performedBy: actorId,
        fromStatus: updated.status,
        toStatus: updated.status,
        details: BREACH_AUDIT_DETAILS,
    });
}

export async function processSlaBreachesForQuery(mongoQuery, requestUserId) {
    const ticketIds = await Ticket.find({
        ...mongoQuery,
        status: { $nin: ["RESOLVED", "CLOSED"] },
    }).distinct("_id");

    for (const ticketId of ticketIds) {
        await processSlaBreachForTicketId(ticketId, requestUserId);
    }
}

export async function processSlaBreachesInstitutionWide(requestUserId) {
    const ticketIds = await Ticket.find({
        status: { $nin: ["RESOLVED", "CLOSED"] },
    }).distinct("_id");

    for (const ticketId of ticketIds) {
        await processSlaBreachForTicketId(ticketId, requestUserId);
    }
}

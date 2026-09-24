import { AuditLog } from "../models/AuditLog.js";

export async function createAuditLog({
    ticketId,
    action,
    performedBy,
    fromStatus = "",
    toStatus = "",
    details = "",
}) {
    return AuditLog.create({
        ticketId,
        action,
        performedBy,
        fromStatus,
        toStatus,
        details,
        timestamp: new Date(),
    });
}

export async function getAuditLogsForTicket(ticketObjectId) {
    return AuditLog.find({ ticketId: ticketObjectId })
        .populate("performedBy", "name role")
        .sort({ timestamp: 1 })
        .lean();
}

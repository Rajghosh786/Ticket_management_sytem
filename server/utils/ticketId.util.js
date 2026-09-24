import { Ticket } from "../models/Ticket.js";

export async function generateTicketId() {
    const latestTicket = await Ticket.findOne({}, { ticketId: 1 })
        .sort({ createdAt: -1 })
        .lean();

    if (!latestTicket?.ticketId) {
        return "TICK-1001";
    }

    const match = latestTicket.ticketId.match(/^TICK-(\d+)$/);
    if (!match) {
        return "TICK-1001";
    }

    const nextNumber = Number.parseInt(match[1], 10) + 1;
    return `TICK-${nextNumber}`;
}

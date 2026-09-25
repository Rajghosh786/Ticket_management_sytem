const ACTIVE_SLA_STATUSES = new Set(["OPEN", "IN_PROGRESS", "REOPENED", "PENDING_STUDENT_ACTION"]);

export function pauseTicketSla(ticket, now = new Date()) {
    if (!ticket.slaPausedAt) {
        ticket.slaPausedAt = now;
    }

    return ticket;
}

export function resumeTicketSla(ticket, now = Date.now()) {
    if (!ticket.slaPausedAt) {
        return ticket;
    }

    const pausedDuration = now - new Date(ticket.slaPausedAt).getTime();
    ticket.totalPausedDuration = (ticket.totalPausedDuration || 0) + pausedDuration;
    ticket.slaPausedAt = null;
    return ticket;
}

export function getEffectiveSlaDeadlineMs(ticket) {
    return new Date(ticket.slaDeadline).getTime() + (ticket.totalPausedDuration || 0);
}

export function getActiveAgeMs(ticket, now = Date.now()) {
    const createdAtMs = new Date(ticket.createdAt).getTime();
    let pausedMs = ticket.totalPausedDuration || 0;

    if (ticket.slaPausedAt && ticket.status === "PENDING_STUDENT_ACTION") {
        pausedMs += now - new Date(ticket.slaPausedAt).getTime();
    }

    return Math.max(0, now - createdAtMs - pausedMs);
}

export function computeSlaStatus(ticket, now = Date.now()) {
    if (!ACTIVE_SLA_STATUSES.has(ticket.status) || ticket.status === "PENDING_STUDENT_ACTION") {
        if (ticket.isBreached) {
            return "BREACHED";
        }
        return ticket.slaStatus || "WITHIN_SLA";
    }

    const effectiveDeadlineMs = getEffectiveSlaDeadlineMs(ticket);
    const remainingMs = effectiveDeadlineMs - now;
    const totalSlaMs = ticket.slaHours * 60 * 60 * 1000;

    if (remainingMs <= 0) {
        return "BREACHED";
    }

    if (remainingMs <= totalSlaMs * 0.25) {
        return "AT_RISK";
    }

    return "WITHIN_SLA";
}

export function getSlaRemainingMs(ticket, now = Date.now()) {
    if (!ACTIVE_SLA_STATUSES.has(ticket.status)) {
        return null;
    }

    if (ticket.status === "PENDING_STUDENT_ACTION") {
        return null;
    }

    const effectiveDeadlineMs = getEffectiveSlaDeadlineMs(ticket);
    return Math.max(0, effectiveDeadlineMs - now);
}

export function enrichTicketTiming(ticket, now = Date.now()) {
    const plain = typeof ticket.toObject === "function" ? ticket.toObject() : { ...ticket };
    const slaStatus = computeSlaStatus(plain, now);
    const slaRemainingMs = getSlaRemainingMs(plain, now);
    const activeAgeMs = getActiveAgeMs(plain, now);
    const isSlaPaused = plain.status === "PENDING_STUDENT_ACTION" && Boolean(plain.slaPausedAt);

    return {
        ...plain,
        slaStatus,
        slaRemainingMs,
        activeAgeMs,
        isSlaPaused,
        effectiveSlaDeadline: new Date(getEffectiveSlaDeadlineMs(plain)).toISOString(),
    };
}

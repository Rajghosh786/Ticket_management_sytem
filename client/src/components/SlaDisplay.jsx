import { formatDuration } from "../utils/time.js";

const SLA_BADGE_STYLES = {
    WITHIN_SLA: "text-slate-700 dark:text-slate-200",
    AT_RISK: "font-semibold text-amber-700 dark:text-amber-300",
    BREACHED: "font-bold text-red-700 dark:text-red-300",
};

export default function SlaDisplay({ ticket, variant = "default" }) {
    if (!ticket) {
        return null;
    }

    const completedStatuses = new Set(["RESOLVED", "CLOSED"]);
    if (completedStatuses.has(ticket.status)) {
        if (variant === "staff") {
            return (
                <span className="text-sm text-green-700 dark:text-green-300">
                    {ticket.status === "CLOSED" ? "Closed" : "Resolved"}
                </span>
            );
        }

        return (
            <span className="text-sm text-green-700 dark:text-green-300">
                {ticket.status === "CLOSED" ? "Closed — SLA complete" : "Resolved — awaiting confirmation"}
            </span>
        );
    }

    if (ticket.isSlaPaused) {
        return (
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {variant === "staff"
                    ? "SLA paused — waiting for student"
                    : "SLA paused — waiting for your response"}
            </span>
        );
    }

    if (ticket.slaStatus === "BREACHED" || ticket.isBreached) {
        return <span className={`status-badge bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200 ${SLA_BADGE_STYLES.BREACHED}`}>BREACHED</span>;
    }

    const style = SLA_BADGE_STYLES[ticket.slaStatus] || SLA_BADGE_STYLES.WITHIN_SLA;

    if (ticket.slaRemainingMs == null) {
        return <span className={`text-sm ${style}`}>{ticket.slaStatus?.replaceAll("_", " ") || "—"}</span>;
    }

    return (
        <span className={`text-sm ${style}`}>
            {formatDuration(ticket.slaRemainingMs)} remaining
        </span>
    );
}

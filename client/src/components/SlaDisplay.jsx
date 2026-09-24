import { formatDuration } from "../utils/time.js";

const SLA_BADGE_STYLES = {
    WITHIN_SLA: "text-slate-700 dark:text-slate-200",
    AT_RISK: "text-amber-700 dark:text-amber-300",
    BREACHED: "text-red-700 dark:text-red-300 font-semibold",
};

export default function SlaDisplay({ ticket }) {
    if (!ticket) {
        return null;
    }

    const completedStatuses = new Set(["RESOLVED", "CLOSED"]);
    if (completedStatuses.has(ticket.status)) {
        return (
            <span className="text-sm text-green-700 dark:text-green-300">
                {ticket.status === "CLOSED" ? "Closed — SLA complete" : "Resolved — awaiting confirmation"}
            </span>
        );
    }

    if (ticket.isSlaPaused) {
        return (
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                SLA paused — waiting for your response
            </span>
        );
    }

    if (ticket.slaStatus === "BREACHED" || ticket.isBreached) {
        return <span className={`text-sm ${SLA_BADGE_STYLES.BREACHED}`}>BREACHED</span>;
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

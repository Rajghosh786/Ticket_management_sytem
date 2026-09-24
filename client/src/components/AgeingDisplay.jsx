import { formatDuration } from "../utils/time.js";

export default function AgeingDisplay({ ticket }) {
    if (!ticket || ticket.activeAgeMs == null) {
        return <span className="text-sm text-slate-600 dark:text-slate-300">—</span>;
    }

    return (
        <span className="text-sm text-slate-700 dark:text-slate-200">
            Age: {formatDuration(ticket.activeAgeMs)}
        </span>
    );
}

import { formatDuration } from "../utils/time.js";

export default function AgeingDisplay({ ticket }) {
    if (!ticket || ticket.activeAgeMs == null) {
        return <span className="text-sm text-slate-500 dark:text-slate-400">—</span>;
    }

    return (
        <span className="text-sm text-slate-600 dark:text-slate-300">
            Age: {formatDuration(ticket.activeAgeMs)}
        </span>
    );
}

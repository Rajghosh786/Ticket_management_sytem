import { formatDateTime } from "../utils/time.js";

function formatActionLabel(action) {
    return action.replaceAll("_", " ");
}

export default function AuditTimeline({ auditHistory = [] }) {
    if (!auditHistory.length) {
        return (
            <p className="text-sm text-slate-500 dark:text-slate-400">No activity recorded yet.</p>
        );
    }

    return (
        <ol className="space-y-4 border-l border-slate-200 pl-4 dark:border-slate-700">
            {auditHistory.map((entry) => (
                <li key={entry._id} className="relative">
                    <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {formatActionLabel(entry.action)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        {entry.performedBy?.name || "System"}
                    </p>
                    {entry.details ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{entry.details}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(entry.timestamp)}
                    </p>
                </li>
            ))}
        </ol>
    );
}

const PRIORITY_STYLES = {
    LOW: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    MEDIUM: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
    HIGH: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
    CRITICAL: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-300 dark:bg-red-950/60 dark:text-red-200 dark:ring-red-800",
};

export default function PriorityBadge({ priority }) {
    return <span className={`priority-badge ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM}`}>{priority}</span>;
}
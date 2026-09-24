const STATUS_STYLES = {
    OPEN: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    IN_PROGRESS: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
    PENDING_STUDENT_ACTION: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
    RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
    CLOSED: "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    REOPENED: "bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-200",
    BREACHED: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
};

export default function StatusBadge({ status }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES.OPEN;

    return (
        <span className={`status-badge ${style}`}>
            {status.replaceAll("_", " ")}
        </span>
    );
}

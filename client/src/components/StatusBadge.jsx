const STATUS_STYLES = {
    OPEN: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    PENDING_STUDENT_ACTION: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    RESOLVED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    CLOSED: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
    REOPENED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
};

export default function StatusBadge({ status }) {
    const style = STATUS_STYLES[status] || STATUS_STYLES.OPEN;

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
            {status.replaceAll("_", " ")}
        </span>
    );
}

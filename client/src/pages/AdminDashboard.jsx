import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import SlaDisplay from "../components/SlaDisplay.jsx";
import AgeingDisplay from "../components/AgeingDisplay.jsx";
import StaffTicketDetailModal from "../components/StaffTicketDetailModal.jsx";
import { fetchTickets } from "../services/ticketService.js";
import { fetchAnalyticsKpis } from "../services/analyticsService.js";
import { formatDateTime } from "../utils/time.js";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["OPEN", "IN_PROGRESS", "PENDING_STUDENT_ACTION", "RESOLVED", "CLOSED", "REOPENED"];
const CATEGORIES = ["FEES", "ATTENDANCE", "CERTIFICATES", "IT_SUPPORT"];

function KpiCard({ label, value, highlight }) {
    return (
        <div
            className={`kpi-card ${
                highlight
                    ? "ring-1 ring-inset ring-red-200 dark:ring-red-900"
                    : ""
            }`}
        >
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p
                className={`mt-1 text-2xl font-bold ${
                    highlight ? "text-red-700 dark:text-red-300" : "text-slate-900 dark:text-slate-50"
                }`}
            >
                {value ?? "—"}
            </p>
        </div>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const [search, setSearch] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterAssignedTo, setFilterAssignedTo] = useState("");
    const [filterBreached, setFilterBreached] = useState("");

    const loadAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const data = await fetchAnalyticsKpis();
            setAnalytics(data);
        } catch {
            // non-critical for table rendering
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    const loadTickets = useCallback(async () => {
        setError("");
        setLoading(true);
        try {
            const query = {};
            if (search) query.search = search;
            if (filterDepartment) query.department = filterDepartment;
            if (filterCategory) query.category = filterCategory;
            if (filterStatus) query.status = filterStatus;
            if (filterPriority) query.priority = filterPriority;
            if (filterAssignedTo) query.assignedTo = filterAssignedTo;
            if (filterBreached === "true") query.breached = "true";

            const data = await fetchTickets(query);
            setTickets(data.tickets || []);
        } catch (err) {
            setError(err.message || "Unable to load tickets");
        } finally {
            setLoading(false);
        }
    }, [search, filterDepartment, filterCategory, filterStatus, filterPriority, filterAssignedTo, filterBreached]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    function handleFilterChange(setter) {
        return (e) => setter(e.target.value);
    }

    function handleClearFilters() {
        setSearch("");
        setFilterDepartment("");
        setFilterCategory("");
        setFilterStatus("");
        setFilterPriority("");
        setFilterAssignedTo("");
        setFilterBreached("");
    }

    const hasFilters =
        search ||
        filterDepartment ||
        filterCategory ||
        filterStatus ||
        filterPriority ||
        filterAssignedTo ||
        filterBreached;

    const departmentOptions = analytics?.departments || [];

    return (
        <AppShell activeNav="dashboard">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Institution-wide management</p>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{user?.name}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">System Administrator</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                        ADMIN
                    </span>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                    <KpiCard label="Total Active" value={analyticsLoading ? "..." : analytics?.totalActive} />
                    <KpiCard label="Total Tickets" value={analyticsLoading ? "..." : analytics?.totalTickets} />
                    <KpiCard label="Open" value={analyticsLoading ? "..." : analytics?.open} />
                    <KpiCard label="In Progress" value={analyticsLoading ? "..." : analytics?.inProgress} />
                    <KpiCard
                        label="Pending Student Action"
                        value={analyticsLoading ? "..." : analytics?.pendingStudentAction}
                    />
                    <KpiCard label="Resolved" value={analyticsLoading ? "..." : analytics?.resolved} />
                    <KpiCard label="Closed" value={analyticsLoading ? "..." : analytics?.closed} />
                    <KpiCard
                        label="Breached"
                        value={analyticsLoading ? "..." : analytics?.breached}
                        highlight={analytics?.breached > 0}
                    />
                    <KpiCard
                        label="Critical Priority"
                        value={analyticsLoading ? "..." : analytics?.criticalPriority}
                        highlight={analytics?.criticalPriority > 0}
                    />
                </section>

                <section className="surface rounded-[22px] p-5">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        Active tickets by department
                    </h2>
                    {analyticsLoading ? (
                        <p className="mt-3 text-sm text-slate-500">Loading summary...</p>
                    ) : (
                        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                            {(analytics?.departmentBreakdown || []).map((row) => (
                                <li
                                    key={row.department}
                                    className="flex items-center justify-between py-2 text-sm"
                                >
                                    <span className="font-medium text-slate-800 dark:text-slate-100">
                                        {row.department}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300">
                                        {row.activeCount} active
                                    </span>
                                </li>
                            ))}
                            {!analytics?.departmentBreakdown?.length ? (
                                <li className="py-2 text-sm text-slate-500">No active tickets.</li>
                            ) : null}
                        </ul>
                    )}
                </section>

                <section className="table-shell">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            Global Ticket Queue
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <input
                            type="text"
                            value={search}
                            onChange={handleFilterChange(setSearch)}
                            placeholder="Search tickets..."
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />

                        <select
                            value={filterDepartment}
                            onChange={handleFilterChange(setFilterDepartment)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="">All departments</option>
                            {departmentOptions.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterCategory}
                            onChange={handleFilterChange(setFilterCategory)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="">All categories</option>
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c.replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={handleFilterChange(setFilterStatus)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="">All statuses</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s.replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterPriority}
                            onChange={handleFilterChange(setFilterPriority)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="">All priorities</option>
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterAssignedTo}
                            onChange={handleFilterChange(setFilterAssignedTo)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="">All assignments</option>
                            <option value="unassigned">Unassigned only</option>
                        </select>

                        <select
                            value={filterBreached}
                            onChange={handleFilterChange(setFilterBreached)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                        >
                            <option value="">All tickets</option>
                            <option value="true">Breached only</option>
                        </select>

                        {hasFilters ? (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Clear filters
                            </button>
                        ) : null}
                    </div>

                    {loading ? (
                        <p className="px-5 py-8 text-sm text-slate-600 dark:text-slate-300">Loading tickets...</p>
                    ) : null}
                    {error ? (
                        <p className="px-5 py-8 text-sm text-red-600 dark:text-red-400">{error}</p>
                    ) : null}
                    {!loading && !error && tickets.length === 0 ? (
                        <p className="px-5 py-8 text-sm text-slate-600 dark:text-slate-300">
                            No tickets found for the current filters.
                        </p>
                    ) : null}

                    {!loading && !error && tickets.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Ticket ID</th>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Department</th>
                                        <th className="px-4 py-3">Title</th>
                                        <th className="px-4 py-3">Priority</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Ageing</th>
                                        <th className="px-4 py-3">SLA Status</th>
                                        <th className="px-4 py-3">Assigned To</th>
                                        <th className="px-4 py-3">Created At</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => {
                                        const isBreachedRow =
                                            ticket.isBreached || ticket.slaStatus === "BREACHED";
                                        const isCritical = ticket.priority === "CRITICAL";
                                        const isUnassigned = !ticket.assignedTo;
                                        const isPendingStudent = ticket.status === "PENDING_STUDENT_ACTION";

                                        return (
                                            <tr
                                                key={ticket._id}
                                                onClick={() => setSelectedTicketId(ticket._id)}
                                                className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                                                    isBreachedRow
                                                        ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
                                                        : isCritical
                                                          ? "border-l-4 border-l-red-400 bg-red-50/20 dark:bg-red-950/10"
                                                          : isPendingStudent
                                                            ? "bg-amber-50/30 dark:bg-amber-950/10"
                                                            : isUnassigned
                                                              ? "bg-slate-50/80 dark:bg-slate-800/30"
                                                              : ""
                                                }`}
                                            >
                                                <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-300">
                                                    {ticket.ticketId}
                                                </td>
                                                <td className="px-4 py-3">{ticket.studentName || "—"}</td>
                                                <td className="px-4 py-3">{ticket.category}</td>
                                                <td className="px-4 py-3">{ticket.department}</td>
                                                <td className="max-w-35 truncate px-4 py-3">{ticket.title}</td>
                                                <td className="px-4 py-3">
                                                    
                                                        <PriorityBadge priority={ticket.priority} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={ticket.status} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <AgeingDisplay ticket={ticket} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <SlaDisplay ticket={ticket} variant="staff" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    {ticket.assignedTo?.name || (
                                                        <span className="font-medium text-slate-500">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                    {formatDateTime(ticket.createdAt)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setSelectedTicketId(ticket._id);
                                                        }}
                                                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </section>
            </div>

            <StaffTicketDetailModal
                ticketId={selectedTicketId}
                open={Boolean(selectedTicketId)}
                onClose={() => setSelectedTicketId(null)}
                onUpdated={() => {
                    loadTickets();
                    loadAnalytics();
                }}
            />
        </AppShell>
    );
}

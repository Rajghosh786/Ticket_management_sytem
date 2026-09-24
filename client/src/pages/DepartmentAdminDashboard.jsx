import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import SlaDisplay from "../components/SlaDisplay.jsx";
import AgeingDisplay from "../components/AgeingDisplay.jsx";
import StaffTicketDetailModal from "../components/StaffTicketDetailModal.jsx";
import { fetchDepartmentAdminKpis, fetchTickets } from "../services/ticketService.js";
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

export default function DepartmentAdminDashboard() {
    const { user } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [kpiLoading, setKpiLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const [filterStatus, setFilterStatus] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterBreached, setFilterBreached] = useState("");
    const [filterAssignedTo, setFilterAssignedTo] = useState("");
    const [search, setSearch] = useState("");

    const loadKpis = useCallback(async () => {
        setKpiLoading(true);
        try {
            const data = await fetchDepartmentAdminKpis();
            setKpis(data);
        } catch {
            // non-critical
        } finally {
            setKpiLoading(false);
        }
    }, []);

    const loadTickets = useCallback(async () => {
        setError("");
        setLoading(true);
        try {
            const query = {};
            if (filterStatus) query.status = filterStatus;
            if (filterCategory) query.category = filterCategory;
            if (filterPriority) query.priority = filterPriority;
            if (filterBreached === "true") query.breached = "true";
            if (filterAssignedTo) query.assignedTo = filterAssignedTo;
            if (search) query.search = search;

            const data = await fetchTickets(query);
            setTickets(data.tickets || []);
        } catch (err) {
            setError(err.message || "Unable to load tickets");
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterCategory, filterPriority, filterBreached, filterAssignedTo, search]);

    useEffect(() => {
        loadKpis();
    }, [loadKpis]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    function handleFilterChange(setter) {
        return (e) => setter(e.target.value);
    }

    function handleClearFilters() {
        setFilterStatus("");
        setFilterCategory("");
        setFilterPriority("");
        setFilterBreached("");
        setFilterAssignedTo("");
        setSearch("");
    }

    const hasFilters =
        filterStatus || filterCategory || filterPriority || filterBreached || filterAssignedTo || search;

    return (
        <AppShell activeNav="dashboard">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Department management</p>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{user?.name}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {user?.role?.replaceAll("_", " ")} · {user?.department}
                        </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
                        DEPARTMENT ADMIN
                    </span>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    <KpiCard label="Total Active" value={kpiLoading ? "..." : kpis?.totalActive} />
                    <KpiCard label="Unassigned" value={kpiLoading ? "..." : kpis?.unassigned} />
                    <KpiCard
                        label="Pending Student Action"
                        value={kpiLoading ? "..." : kpis?.pendingStudentAction}
                    />
                    <KpiCard label="In Progress" value={kpiLoading ? "..." : kpis?.inProgress} />
                    <KpiCard label="Resolved" value={kpiLoading ? "..." : kpis?.resolved} />
                    <KpiCard
                        label="Breached"
                        value={kpiLoading ? "..." : kpis?.breached}
                        highlight={kpis?.breached > 0}
                    />
                </section>

                <section className="table-shell">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            Department Ticket Queue
                            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                                — {user?.department}
                            </span>
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
                                            ticket.slaStatus === "BREACHED" || ticket.isBreached;
                                        const isUnassigned = !ticket.assignedTo;

                                        return (
                                            <tr
                                                key={ticket._id}
                                                onClick={() => setSelectedTicketId(ticket._id)}
                                                className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                                                    isBreachedRow
                                                        ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20"
                                                        : isUnassigned
                                                          ? "bg-amber-50/30 dark:bg-amber-950/10"
                                                          : ""
                                                }`}
                                            >
                                                <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-300">
                                                    {ticket.ticketId}
                                                </td>
                                                <td className="px-4 py-3">{ticket.studentName || "—"}</td>
                                                <td className="px-4 py-3">{ticket.category}</td>
                                                <td className="max-w-40 truncate px-4 py-3">{ticket.title}</td>
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
                                                        <span className="font-medium text-amber-700 dark:text-amber-300">
                                                            Unassigned
                                                        </span>
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
                                                        className="rounded-lg border border-indigo-300 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                                                    >
                                                        {isUnassigned ? "Assign" : "Manage"}
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
                    loadKpis();
                }}
            />
        </AppShell>
    );
}

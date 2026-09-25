import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import StyledSelect from "../components/StyledSelect.jsx";
import SlaDisplay from "../components/SlaDisplay.jsx";
import AgeingDisplay from "../components/AgeingDisplay.jsx";
import StaffTicketDetailModal from "../components/StaffTicketDetailModal.jsx";
import { fetchStaffKpis, fetchTickets } from "../services/ticketService.js";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["OPEN", "IN_PROGRESS", "PENDING_STUDENT_ACTION", "RESOLVED", "CLOSED", "REOPENED"];
const CATEGORIES = ["FEES", "ATTENDANCE", "CERTIFICATES", "IT_SUPPORT"];
const SLA_STATUSES = ["WITHIN_SLA", "AT_RISK", "BREACHED"];

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

export default function StaffDashboard() {
    const { user } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [kpiLoading, setKpiLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterSlaStatus, setFilterSlaStatus] = useState("");
    const [filterAssignedTo, setFilterAssignedTo] = useState("");
    const [search, setSearch] = useState("");

    const loadKpis = useCallback(async () => {
        setKpiLoading(true);
        try {
            const data = await fetchStaffKpis();
            setKpis(data);
        } catch {
            // KPIs are non-critical; fail silently on display
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
            if (filterSlaStatus === "WITHIN_SLA") query.breached = "false";
            if (filterSlaStatus === "BREACHED") query.breached = "true";
            if (filterSlaStatus === "AT_RISK") query.slaStatus = "AT_RISK";
            if (filterAssignedTo) query.assignedTo = filterAssignedTo;
            if (search) query.search = search;

            const data = await fetchTickets(query);
            setTickets(data.tickets || []);
        } catch (err) {
            setError(err.message || "Unable to load tickets");
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterCategory, filterPriority, filterSlaStatus, filterAssignedTo, search]);

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
        setFilterSlaStatus("");
        setFilterAssignedTo("");
        setSearch("");
    }

    const hasFilters =
        filterStatus || filterCategory || filterPriority || filterSlaStatus || filterAssignedTo || search;

    return (
        <AppShell activeNav="dashboard">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Welcome back</p>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{user?.name}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Department: {user?.department}
                        </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                        STAFF
                    </span>
                </div>

                {/* KPI cards */}
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard label="Active Tickets" value={kpiLoading ? "..." : kpis?.activeTickets} />
                    <KpiCard
                        label="Pending Student Action"
                        value={kpiLoading ? "..." : kpis?.pendingStudentAction}
                    />
                    <KpiCard label="Resolved" value={kpiLoading ? "..." : kpis?.resolved} />
                    <KpiCard
                        label="SLA Breached"
                        value={kpiLoading ? "..." : kpis?.breached}
                        highlight={kpis?.breached > 0}
                    />
                </section>

                {/* Ticket queue */}
                <section className="table-shell">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            Department Ticket Queue
                            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                                — {user?.department}
                            </span>
                        </h2>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <input
                            type="text"
                            value={search}
                            onChange={handleFilterChange(setSearch)}
                            placeholder="Search tickets..."
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />

                        <StyledSelect
                            value={filterStatus}
                            onChange={handleFilterChange(setFilterStatus)}
                            placeholder="All statuses"
                            options={[{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))]}
                            ariaLabel="Status"
                        />

                        <StyledSelect
                            value={filterCategory}
                            onChange={handleFilterChange(setFilterCategory)}
                            placeholder="All categories"
                            options={[{ value: "", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c.replaceAll("_", " ") }))]}
                            ariaLabel="Category"
                        />

                        <StyledSelect
                            value={filterPriority}
                            onChange={handleFilterChange(setFilterPriority)}
                            placeholder="All priorities"
                            options={[{ value: "", label: "All priorities" }, ...PRIORITIES]}
                            ariaLabel="Priority"
                        />

                        <StyledSelect
                            value={filterSlaStatus}
                            onChange={handleFilterChange(setFilterSlaStatus)}
                            placeholder="All SLA"
                            options={[{ value: "", label: "All SLA" }, ...SLA_STATUSES.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))]}
                            ariaLabel="SLA Status"
                        />

                        <StyledSelect
                            value={filterAssignedTo}
                            onChange={handleFilterChange(setFilterAssignedTo)}
                            placeholder="All assignments"
                            options={[{ value: "", label: "All assignments" }, { value: "me", label: "Assigned to me" }, { value: "unassigned", label: "Unassigned" }]}
                            ariaLabel="Assignment"
                        />

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

                    {/* Table */}
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
                                        <th className="px-4 py-3">Department</th>
                                        <th className="px-4 py-3">SLA</th>
                                        <th className="px-4 py-3">Ageing</th>
                                        <th className="px-4 py-3">Assigned To</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => {
                                        const isBreachedRow =
                                            ticket.slaStatus === "BREACHED" || ticket.isBreached;
                                        return (
                                            <tr
                                                key={ticket._id}
                                                onClick={() => setSelectedTicketId(ticket._id)}
                                                className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${
                                                    isBreachedRow
                                                        ? "bg-red-50/40 dark:bg-red-950/10"
                                                        : ""
                                                }`}
                                            >
                                                <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-300">
                                                    {ticket.ticketId}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                                    {ticket.studentName || "—"}
                                                </td>
                                                <td className="px-4 py-3">{ticket.category}</td>
                                                <td className="max-w-40 truncate px-4 py-3">
                                                    {ticket.title}
                                                </td>
                                                <td className="px-4 py-3">
                                                    
                                                        <PriorityBadge priority={ticket.priority} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={ticket.status} />
                                                </td>
                                                <td className="px-4 py-3">{ticket.department}</td>
                                                <td className="px-4 py-3">
                                                    <SlaDisplay ticket={ticket} variant="staff" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <AgeingDisplay ticket={ticket} />
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                                    {ticket.assignedTo?.name ? (
                                                        <span>
                                                            {ticket.assignedTo.name}
                                                            {String(ticket.assignedTo._id) === String(user?._id) ? (
                                                                <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                                                                    (you)
                                                                </span>
                                                            ) : null}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Unassigned</span>
                                                    )}
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
                    loadKpis();
                }}
            />
        </AppShell>
    );
}

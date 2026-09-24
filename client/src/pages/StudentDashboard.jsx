import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import RaiseTicketModal from "../components/RaiseTicketModal.jsx";
import TicketDetailModal from "../components/TicketDetailModal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SlaDisplay from "../components/SlaDisplay.jsx";
import AgeingDisplay from "../components/AgeingDisplay.jsx";
import { fetchTickets } from "../services/ticketService.js";

function SummaryCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
        </div>
    );
}

export default function StudentDashboard() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [summary, setSummary] = useState({
        activeTickets: 0,
        pendingAction: 0,
        resolved: 0,
        closed: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [raiseOpen, setRaiseOpen] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const loadTickets = useCallback(async () => {
        setError("");
        setLoading(true);
        try {
            const data = await fetchTickets();
            setTickets(data.tickets || []);
            setSummary(
                data.summary || {
                    activeTickets: 0,
                    pendingAction: 0,
                    resolved: 0,
                    closed: 0,
                }
            );
        } catch (err) {
            setError(err.message || "Unable to load tickets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    return (
        <AppShell activeNav="dashboard">
            <div className="mx-auto max-w-6xl space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Welcome back</p>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            {user?.name}
                        </h1>
                        {user?.rollNo ? (
                            <p className="text-sm text-slate-600 dark:text-slate-300">Roll No: {user.rollNo}</p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={() => setRaiseOpen(true)}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        + Raise Ticket
                    </button>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Active Tickets" value={summary.activeTickets} />
                    <SummaryCard label="Pending Action" value={summary.pendingAction} />
                    <SummaryCard label="Resolved" value={summary.resolved} />
                    <SummaryCard label="Closed" value={summary.closed} />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">My Tickets</h2>
                    </div>

                    {loading ? (
                        <p className="px-5 py-8 text-sm text-slate-600 dark:text-slate-300">Loading tickets...</p>
                    ) : null}
                    {error ? (
                        <p className="px-5 py-8 text-sm text-red-600 dark:text-red-400">{error}</p>
                    ) : null}

                    {!loading && !error && tickets.length === 0 ? (
                        <p className="px-5 py-8 text-sm text-slate-600 dark:text-slate-300">
                            You have not raised any tickets yet. Use Raise Ticket to get started.
                        </p>
                    ) : null}

                    {!loading && !error && tickets.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                    <tr>
                                        <th className="px-5 py-3">Ticket ID</th>
                                        <th className="px-5 py-3">Category</th>
                                        <th className="px-5 py-3">Title</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Priority</th>
                                        <th className="px-5 py-3">Department</th>
                                        <th className="px-5 py-3">SLA</th>
                                        <th className="px-5 py-3">Ageing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr
                                            key={ticket._id}
                                            className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                            onClick={() => setSelectedTicketId(ticket._id)}
                                        >
                                            <td className="px-5 py-3 font-medium text-blue-700 dark:text-blue-300">
                                                {ticket.ticketId}
                                            </td>
                                            <td className="px-5 py-3">{ticket.category}</td>
                                            <td className="px-5 py-3">{ticket.title}</td>
                                            <td className="px-5 py-3">
                                                <StatusBadge status={ticket.status} />
                                            </td>
                                            <td className="px-5 py-3">{ticket.priority}</td>
                                            <td className="px-5 py-3">{ticket.department}</td>
                                            <td className="px-5 py-3">
                                                <SlaDisplay ticket={ticket} />
                                            </td>
                                            <td className="px-5 py-3">
                                                <AgeingDisplay ticket={ticket} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </section>
            </div>

            <RaiseTicketModal
                open={raiseOpen}
                onClose={() => setRaiseOpen(false)}
                onCreated={() => loadTickets()}
            />

            <TicketDetailModal
                ticketId={selectedTicketId}
                open={Boolean(selectedTicketId)}
                onClose={() => setSelectedTicketId(null)}
                onUpdated={loadTickets}
            />
        </AppShell>
    );
}

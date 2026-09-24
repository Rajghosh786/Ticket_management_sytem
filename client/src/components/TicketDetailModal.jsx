import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge.jsx";
import SlaDisplay from "./SlaDisplay.jsx";
import AgeingDisplay from "./AgeingDisplay.jsx";
import AuditTimeline from "./AuditTimeline.jsx";
import { formatDateTime } from "../utils/time.js";
import {
    closeTicket,
    fetchTicketById,
    reopenTicket,
    respondToPendingAction,
} from "../services/ticketService.js";

export default function TicketDetailModal({ ticketId, open, onClose, onUpdated }) {
    const [ticket, setTicket] = useState(null);
    const [auditHistory, setAuditHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [reopenReason, setReopenReason] = useState("");
    const [isClosing, setIsClosing] = useState(false);
    const [isReopening, setIsReopening] = useState(false);
    const [studentResponse, setStudentResponse] = useState("");
    const [isResponding, setIsResponding] = useState(false);

    useEffect(() => {
        if (!open || !ticketId) {
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError("");
            setActionError("");
            setActionMessage("");
            setReopenReason("");
            setStudentResponse("");
            try {
                const data = await fetchTicketById(ticketId);
                if (!cancelled) {
                    setTicket(data.ticket);
                    setAuditHistory(data.auditHistory || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Unable to load ticket");
                    setTicket(null);
                    setAuditHistory([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [open, ticketId]);

    if (!open) {
        return null;
    }

    const handleSubmitResponse = async () => {
        setActionError("");
        setActionMessage("");

        if (!studentResponse.trim()) {
            setActionError("Please enter your response.");
            return;
        }

        setIsResponding(true);
        try {
            const updated = await respondToPendingAction(ticketId, studentResponse.trim());
            setTicket(updated);
            setStudentResponse("");
            setActionMessage("Response submitted. The ticket is back in progress.");
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to submit response");
        } finally {
            setIsResponding(false);
        }
    };

    const handleCloseTicket = async () => {
        setActionError("");
        setActionMessage("");
        setIsClosing(true);
        try {
            const updated = await closeTicket(ticketId);
            setTicket(updated);
            setActionMessage("Ticket closed successfully.");
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to close ticket");
        } finally {
            setIsClosing(false);
        }
    };

    const handleReopenTicket = async () => {
        setActionError("");
        setActionMessage("");

        if (!reopenReason.trim()) {
            setActionError("Reopen reason is required.");
            return;
        }

        setIsReopening(true);
        try {
            const updated = await reopenTicket(ticketId, reopenReason.trim());
            setTicket(updated);
            setActionMessage("Ticket reopened successfully.");
            setReopenReason("");
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to reopen ticket");
        } finally {
            setIsReopening(false);
        }
    };

    return (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="modal-surface flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                    <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {ticket?.ticketId || "Ticket details"}
                        </p>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                            {ticket?.title || "Loading..."}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-2 py-1 text-slate-500 hover:bg-black/5 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-slate-200"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-5">
                    {loading ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300">Loading ticket...</p>
                    ) : null}
                    {error ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            {error}
                        </p>
                    ) : null}

                    {ticket && !error ? (
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={ticket.status} />
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium dark:bg-slate-800">
                                    {ticket.priority}
                                </span>
                                <span className="text-sm text-slate-600 dark:text-slate-300">{ticket.category}</span>
                            </div>

                            <p className="text-sm text-slate-700 dark:text-slate-200">{ticket.description}</p>

                            <dl className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">Department</dt>
                                    <dd className="text-sm font-medium">{ticket.department}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">Assigned staff</dt>
                                    <dd className="text-sm font-medium">
                                        {ticket.assignedTo?.name || "Not assigned yet"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">SLA</dt>
                                    <dd>
                                        <SlaDisplay ticket={ticket} />
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">Ageing</dt>
                                    <dd>
                                        <AgeingDisplay ticket={ticket} />
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">Created</dt>
                                    <dd className="text-sm">{formatDateTime(ticket.createdAt)}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">Updated</dt>
                                    <dd className="text-sm">{formatDateTime(ticket.updatedAt)}</dd>
                                </div>
                            </dl>

                            {ticket.status === "PENDING_STUDENT_ACTION" && ticket.staffQuery ? (
                                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                        Action required — waiting for your response
                                    </p>
                                    <p className="text-sm text-amber-800 dark:text-amber-100">{ticket.staffQuery}</p>
                                    <textarea
                                        value={studentResponse}
                                        onChange={(e) => setStudentResponse(e.target.value)}
                                        rows={3}
                                        disabled={isResponding}
                                        placeholder="Provide the information requested by staff"
                                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-800 dark:bg-slate-900"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSubmitResponse}
                                        disabled={isResponding}
                                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-70"
                                    >
                                        {isResponding ? "Submitting..." : "Submit Response"}
                                    </button>
                                </div>
                            ) : null}

                            {ticket.resolutionNotes ? (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                                    <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                                        Resolution notes
                                    </p>
                                    <p className="mt-1 text-sm text-green-800 dark:text-green-100">
                                        {ticket.resolutionNotes}
                                    </p>
                                    {ticket.resolvedAt ? (
                                        <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                                            Resolved {formatDateTime(ticket.resolvedAt)}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}

                            {ticket.status === "RESOLVED" ? (
                                <button
                                    type="button"
                                    onClick={handleCloseTicket}
                                    disabled={isClosing}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-70"
                                >
                                    {isClosing ? "Closing..." : "Confirm & Close"}
                                </button>
                            ) : null}

                            {ticket.status === "CLOSED" ? (
                                <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                    <p className="text-sm font-medium">Reopen this ticket (within 48 hours of closure)</p>
                                    <textarea
                                        value={reopenReason}
                                        onChange={(e) => setReopenReason(e.target.value)}
                                        rows={3}
                                        disabled={isReopening}
                                        className="field-control w-full rounded-xl px-3 py-2 text-sm"
                                        placeholder="Explain why you need to reopen this ticket"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleReopenTicket}
                                        disabled={isReopening}
                                        className="primary-button rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-70"
                                    >
                                        {isReopening ? "Reopening..." : "Reopen Ticket"}
                                    </button>
                                </div>
                            ) : null}

                            {actionError ? (
                                <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                            ) : null}
                            {actionMessage ? (
                                <p className="text-sm text-green-700 dark:text-green-300">{actionMessage}</p>
                            ) : null}

                            <div>
                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Activity timeline
                                </h3>
                                <AuditTimeline auditHistory={auditHistory} />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

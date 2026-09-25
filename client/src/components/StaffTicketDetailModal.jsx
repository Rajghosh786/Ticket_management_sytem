import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "./StatusBadge.jsx";
import PriorityBadge from "./PriorityBadge.jsx";
import StyledSelect from "./StyledSelect.jsx";
import SlaDisplay from "./SlaDisplay.jsx";
import AgeingDisplay from "./AgeingDisplay.jsx";
import AuditTimeline from "./AuditTimeline.jsx";
import { formatDateTime } from "../utils/time.js";
import {
    assignTicket,
    changeTicketPriority,
    changeTicketStatus,
    fetchTicketById,
    takeTicket,
} from "../services/ticketService.js";
import { fetchDepartmentStaff } from "../services/userService.js";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function StaffTicketDetailModal({ ticketId, open, onClose, onUpdated }) {
    const { user } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [auditHistory, setAuditHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Action state
    const [actionError, setActionError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [busy, setBusy] = useState(false);

    // Resolve form
    const [showResolveForm, setShowResolveForm] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState("");

    // Request student action form
    const [showQueryForm, setShowQueryForm] = useState(false);
    const [staffQuery, setStaffQuery] = useState("");

    // Priority change
    const [showPriorityForm, setShowPriorityForm] = useState(false);
    const [newPriority, setNewPriority] = useState("");

    // Department Admin assignment
    const [departmentStaff, setDepartmentStaff] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [showAssignForm, setShowAssignForm] = useState(false);

    async function loadTicket() {
        if (!ticketId) return;
        setLoading(true);
        setError("");
        try {
            const data = await fetchTicketById(ticketId);
            setTicket(data.ticket);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setError(err.message || "Unable to load ticket");
            setTicket(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!open || !ticketId) return;
        setActionError("");
        setActionMessage("");
        setResolutionNotes("");
        setStaffQuery("");
        setNewPriority("");
        setShowResolveForm(false);
        setShowQueryForm(false);
        setShowPriorityForm(false);
        setShowAssignForm(false);
        setSelectedStaffId("");
        loadTicket();
        if (user?.role === "DEPARTMENT_ADMIN") {
            fetchDepartmentStaff()
                .then(setDepartmentStaff)
                .catch(() => setDepartmentStaff([]));
        }
    }, [open, ticketId, user?.role]);

    if (!open) return null;

    const isDepartmentAdmin = user?.role === "DEPARTMENT_ADMIN";
    const isSystemAdmin = user?.role === "ADMIN";
    const isAssignedToMe = ticket?.assignedTo && String(ticket.assignedTo._id) === String(user?._id);
    const isUnassigned = !ticket?.assignedTo;
    const canManageTicket = ticket && ticket.status !== "CLOSED";

    async function handleTakeTicket() {
        setActionError("");
        setActionMessage("");
        setBusy(true);
        try {
            const updated = await takeTicket(ticketId);
            setTicket(updated);
            setActionMessage("Ticket assigned to you successfully.");
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to take ticket");
        } finally {
            setBusy(false);
        }
    }

    async function handleStartWorking() {
        setActionError("");
        setActionMessage("");
        setBusy(true);
        try {
            const updated = await changeTicketStatus(ticketId, { status: "IN_PROGRESS" });
            setTicket(updated);
            setActionMessage("Ticket is now In Progress.");
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to update status");
        } finally {
            setBusy(false);
        }
    }

    async function handleRequestStudentAction() {
        setActionError("");
        setActionMessage("");
        if (!staffQuery.trim()) {
            setActionError("Please enter a query message for the student.");
            return;
        }
        setBusy(true);
        try {
            const updated = await changeTicketStatus(ticketId, {
                status: "PENDING_STUDENT_ACTION",
                staffQuery: staffQuery.trim(),
            });
            setTicket(updated);
            setActionMessage("Student action requested. SLA is now paused.");
            setStaffQuery("");
            setShowQueryForm(false);
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to request student action");
        } finally {
            setBusy(false);
        }
    }

    async function handleResolve() {
        setActionError("");
        setActionMessage("");
        if (!resolutionNotes.trim()) {
            setActionError("Resolution notes are required.");
            return;
        }
        setBusy(true);
        try {
            const updated = await changeTicketStatus(ticketId, {
                status: "RESOLVED",
                resolutionNotes: resolutionNotes.trim(),
            });
            setTicket(updated);
            setActionMessage("Ticket resolved successfully.");
            setResolutionNotes("");
            setShowResolveForm(false);
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to resolve ticket");
        } finally {
            setBusy(false);
        }
    }

    async function handleAssignStaff() {
        setActionError("");
        setActionMessage("");
        if (!selectedStaffId) {
            setActionError("Please select a staff member.");
            return;
        }
        setBusy(true);
        try {
            const updated = await assignTicket(ticketId, selectedStaffId);
            setTicket(updated);
            setActionMessage("Ticket assigned successfully.");
            setSelectedStaffId("");
            setShowAssignForm(false);
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to assign ticket");
        } finally {
            setBusy(false);
        }
    }

    async function handleChangePriority() {
        setActionError("");
        setActionMessage("");
        if (!newPriority) {
            setActionError("Please select a priority.");
            return;
        }
        setBusy(true);
        try {
            const updated = await changeTicketPriority(ticketId, newPriority);
            setTicket(updated);
            setActionMessage(`Priority changed to ${newPriority}.`);
            setNewPriority("");
            setShowPriorityForm(false);
            onUpdated?.();
            const data = await fetchTicketById(ticketId);
            setAuditHistory(data.auditHistory || []);
        } catch (err) {
            setActionError(err.message || "Unable to change priority");
        } finally {
            setBusy(false);
        }
    }

    const canStartWorking = ticket?.status === "OPEN" || ticket?.status === "REOPENED";
    const canRequestAction = ticket?.status === "IN_PROGRESS";
    const canResolve = ticket?.status === "IN_PROGRESS";
    const isActive = !["RESOLVED", "CLOSED"].includes(ticket?.status || "");

    return (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="modal-surface flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
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
                            {isSystemAdmin && (ticket.isBreached || ticket.slaStatus === "BREACHED") ? (
                                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/40">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                                        SLA Breached — escalated to CRITICAL
                                    </p>
                                    <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                                        This ticket requires management attention.
                                    </p>
                                </div>
                            ) : null}

                            {/* Status / Priority / Category badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                                <span className="text-sm text-slate-600 dark:text-slate-300">{ticket.category}</span>
                            </div>

                            {/* Student info */}
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
                                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Student</p>
                                <p className="mt-1 font-medium text-slate-900 dark:text-slate-50">
                                    {ticket.studentId?.name || ticket.studentName || "—"}
                                </p>
                                {ticket.studentId?.rollNo ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Roll No: {ticket.studentId.rollNo}
                                    </p>
                                ) : null}
                                {ticket.studentId?.email ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {ticket.studentId.email}
                                    </p>
                                ) : null}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-slate-700 dark:text-slate-200">{ticket.description}</p>

                            {/* Metadata grid */}
                            <dl className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">Department</dt>
                                    <dd className="text-sm font-medium">{ticket.department}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">Assigned To</dt>
                                    <dd className="text-sm font-medium">
                                        {ticket.assignedTo ? (
                                            <span>
                                                {ticket.assignedTo.name}
                                                {isAssignedToMe ? (
                                                    <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                                                        (you)
                                                    </span>
                                                ) : null}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">Unassigned</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">SLA deadline</dt>
                                    <dd className="text-sm">{formatDateTime(ticket.effectiveSlaDeadline || ticket.slaDeadline)}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs uppercase text-slate-500">SLA status</dt>
                                    <dd>
                                        <SlaDisplay ticket={ticket} variant="staff" />
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

                            {/* Pending student action notice */}
                            {ticket.status === "PENDING_STUDENT_ACTION" && ticket.staffQuery ? (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                        Waiting for student response
                                    </p>
                                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-100">
                                        {ticket.staffQuery}
                                    </p>
                                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                                        SLA is paused until the student responds.
                                    </p>
                                </div>
                            ) : null}

                            {/* Resolution notes */}
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

                            {/* Department Admin actions */}
                            {isDepartmentAdmin && !isSystemAdmin && canManageTicket ? (
                                <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
                                    <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                                        Department Admin actions
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAssignForm(!showAssignForm);
                                                setShowPriorityForm(false);
                                            }}
                                            disabled={busy}
                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                                        >
                                            {isUnassigned ? "Assign Staff" : "Reassign Staff"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPriorityForm(!showPriorityForm);
                                                setShowAssignForm(false);
                                            }}
                                            disabled={busy}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Change Priority
                                        </button>
                                    </div>

                                    {showAssignForm ? (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <StyledSelect
                                                value={selectedStaffId}
                                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                                disabled={busy}
                                                placeholder="Select staff member"
                                                options={[{ value: "", label: "Select staff member" }, ...departmentStaff.map((member) => ({ value: member._id, label: `${member.name} — ${member.department}` }))]}
                                                ariaLabel="Staff member"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAssignStaff}
                                                disabled={busy || !selectedStaffId}
                                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                                            >
                                                {busy ? "Assigning..." : "Assign"}
                                            </button>
                                        </div>
                                    ) : null}

                                    {showPriorityForm ? (
                                        <div className="mt-3 flex items-center gap-2">
                                            <StyledSelect
                                                value={newPriority}
                                                onChange={(e) => setNewPriority(e.target.value)}
                                                disabled={busy}
                                                placeholder="Select priority"
                                                options={[{ value: "", label: "Select priority" }, ...PRIORITIES]}
                                                ariaLabel="Priority"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleChangePriority}
                                                disabled={busy || !newPriority}
                                                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
                                            >
                                                {busy ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {/* Staff actions */}
                            {!isDepartmentAdmin && !isSystemAdmin && isActive ? (
                                <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Staff actions
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {/* Take ticket */}
                                        {isUnassigned ? (
                                            <button
                                                type="button"
                                                onClick={handleTakeTicket}
                                                disabled={busy}
                                                className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70 dark:bg-slate-600 dark:hover:bg-slate-500"
                                            >
                                                {busy ? "Working..." : "Take Ticket"}
                                            </button>
                                        ) : null}

                                        {/* Start Working */}
                                        {canStartWorking ? (
                                            <button
                                                type="button"
                                                onClick={handleStartWorking}
                                                disabled={busy}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                                            >
                                                {busy ? "Working..." : "Start Working"}
                                            </button>
                                        ) : null}

                                        {/* Request Student Action */}
                                        {canRequestAction ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowQueryForm(!showQueryForm);
                                                    setShowResolveForm(false);
                                                    setShowPriorityForm(false);
                                                }}
                                                disabled={busy}
                                                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-70"
                                            >
                                                Request Student Action
                                            </button>
                                        ) : null}

                                        {/* Resolve Ticket */}
                                        {canResolve ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowResolveForm(!showResolveForm);
                                                    setShowQueryForm(false);
                                                    setShowPriorityForm(false);
                                                }}
                                                disabled={busy}
                                                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-70"
                                            >
                                                Resolve Ticket
                                            </button>
                                        ) : null}

                                        {/* Change Priority */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPriorityForm(!showPriorityForm);
                                                setShowQueryForm(false);
                                                setShowResolveForm(false);
                                            }}
                                            disabled={busy}
                                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-70 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            Change Priority
                                        </button>
                                    </div>

                                    {/* Request student action form */}
                                    {showQueryForm ? (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-sm text-slate-700 dark:text-slate-200">
                                                Enter your query for the student:
                                            </p>
                                            <textarea
                                                value={staffQuery}
                                                onChange={(e) => setStaffQuery(e.target.value)}
                                                rows={3}
                                                disabled={busy}
                                                placeholder="e.g. Please upload the payment receipt so we can verify the transaction."
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRequestStudentAction}
                                                disabled={busy}
                                                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-70"
                                            >
                                                {busy ? "Sending..." : "Send Request"}
                                            </button>
                                        </div>
                                    ) : null}

                                    {/* Resolve form */}
                                    {showResolveForm ? (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-sm text-slate-700 dark:text-slate-200">
                                                Enter resolution notes{" "}
                                                <span className="text-red-500">*</span>:
                                            </p>
                                            <textarea
                                                value={resolutionNotes}
                                                onChange={(e) => setResolutionNotes(e.target.value)}
                                                rows={3}
                                                disabled={busy}
                                                placeholder="e.g. Payment receipt verified and the fee record has been updated."
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleResolve}
                                                disabled={busy}
                                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-70"
                                            >
                                                {busy ? "Resolving..." : "Confirm Resolution"}
                                            </button>
                                        </div>
                                    ) : null}

                                    {/* Priority form */}
                                    {showPriorityForm ? (
                                        <div className="mt-3 flex items-center gap-2">
                                            <StyledSelect
                                                value={newPriority}
                                                onChange={(e) => setNewPriority(e.target.value)}
                                                disabled={busy}
                                                placeholder="Select priority"
                                                options={[{ value: "", label: "Select priority" }, ...PRIORITIES]}
                                                ariaLabel="Priority"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleChangePriority}
                                                disabled={busy || !newPriority}
                                                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
                                            >
                                                {busy ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}

                            {/* Action feedback */}
                            {actionError ? (
                                <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>
                            ) : null}
                            {actionMessage ? (
                                <p className="text-sm text-green-700 dark:text-green-300">{actionMessage}</p>
                            ) : null}

                            {/* Audit timeline */}
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

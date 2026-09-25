import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDateTime } from "../utils/time.js";
import {
    acceptDocumentRequest,
    createDocumentRequest,
    getAttachmentAccess,
    rejectDocumentRequest,
    submitDocumentRequest,
} from "../services/ticketService.js";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

function formatFileSize(size = 0) {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file) {
    if (!file) return "Please select a document to upload.";
    if (file.size > MAX_FILE_SIZE) return "File must be 2 MB or smaller.";
    if (!ALLOWED_FILE_TYPES.includes(file.type)) return "Only PDF, JPG, JPEG, and PNG files are allowed.";
    return "";
}

function DocumentStatusBadge({ status }) {
    const styles = {
        PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
        SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
        ACCEPTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
        REJECTED: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200",
        CANCELLED: "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300",
    };
    return <span className={`status-badge ${styles[status] || styles.PENDING}`}>{status}</span>;
}

function AccessButton({ ticketId, attachmentId, allowDownload = false }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const openAttachment = async (download = false) => {
        setBusy(true);
        setError("");
        try {
            const data = await getAttachmentAccess(ticketId, attachmentId);
            if (download) {
                const link = document.createElement("a");
                link.href = data.url;
                link.download = data.attachment?.originalName || "attachment";
                link.click();
            } else {
                window.open(data.url, "_blank", "noopener,noreferrer");
            }
        } catch (err) {
            setError(err.message || "Unable to access document");
        } finally {
            setBusy(false);
        }
    };

    return (
        <span className="inline-flex items-center gap-2">
            <button type="button" onClick={() => openAttachment(false)} disabled={busy} className="font-semibold text-(--magenta-600) disabled:opacity-60">
                {busy ? "Loading..." : "View"}
            </button>
            {allowDownload ? <button type="button" onClick={() => openAttachment(true)} disabled={busy} className="font-semibold text-(--magenta-600) disabled:opacity-60">Download</button> : null}
            {error ? <span className="text-xs text-red-600">{error}</span> : null}
        </span>
    );
}

export default function DocumentWorkflow({
    ticketId,
    attachments = [],
    documentRequests = [],
    isStaffView = false,
    validationMessage = "",
    onRefresh,
}) {
    const { user } = useAuth();
    const [selectedFiles, setSelectedFiles] = useState({});
    const [fileErrors, setFileErrors] = useState({});
    const [busyRequestId, setBusyRequestId] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [documentName, setDocumentName] = useState("");
    const [requestMessage, setRequestMessage] = useState("");
    const [requestErrors, setRequestErrors] = useState({});
    const [showRejectForm, setShowRejectForm] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectionError, setRejectionError] = useState("");
    const [isRequesting, setIsRequesting] = useState(false);

    const handleFileChange = (requestId, event) => {
        const file = event.target.files?.[0];
        const error = file ? validateFile(file) : "";
        setFileErrors((current) => ({ ...current, [requestId]: error }));
        setSelectedFiles((current) => ({ ...current, [requestId]: error ? null : file }));
        if (error) event.target.value = "";
    };

    const refresh = async (message) => {
        setActionError("");
        setActionMessage(message);
        await onRefresh?.();
    };

    const handleSubmit = async (request) => {
        const file = selectedFiles[request._id];
        const error = validateFile(file);
        if (error) {
            setFileErrors((current) => ({ ...current, [request._id]: error }));
            return;
        }
        setBusyRequestId(request._id);
        setActionError("");
        try {
            await submitDocumentRequest(ticketId, request._id, file);
            setSelectedFiles((current) => ({ ...current, [request._id]: null }));
            await refresh("Document submitted successfully. Staff can now review it.");
        } catch (err) {
            setActionError(err.message || "Unable to submit document");
        } finally {
            setBusyRequestId("");
        }
    };

    const handleRequest = async (event) => {
        event.preventDefault();
        const errors = {
            documentName: documentName.trim() ? "" : "Document name is required.",
            message: requestMessage.trim() ? "" : "Please provide instructions or additional information for the student.",
        };
        setRequestErrors(errors);
        if (errors.documentName || errors.message) {
            return;
        }
        setIsRequesting(true);
        setActionError("");
        try {
            await createDocumentRequest(ticketId, documentName.trim(), requestMessage.trim());
            setDocumentName("");
            setRequestMessage("");
            setRequestErrors({});
            setShowRequestForm(false);
            await refresh("Document request sent. SLA is paused while student action is pending.");
        } catch (err) {
            setActionError(err.message || "Unable to request document");
        } finally {
            setIsRequesting(false);
        }
    };

    const handleAccept = async (request) => {
        setBusyRequestId(request._id);
        setActionError("");
        try {
            await acceptDocumentRequest(ticketId, request._id);
            await refresh("Document accepted.");
        } catch (err) {
            setActionError(err.message || "Unable to accept document");
        } finally {
            setBusyRequestId("");
        }
    };

    const handleReject = async (request) => {
        if (!rejectionReason.trim()) {
            setRejectionError("Rejection reason is required.");
            return;
        }
        setRejectionError("");
        setBusyRequestId(request._id);
        setActionError("");
        try {
            await rejectDocumentRequest(ticketId, request._id, rejectionReason.trim());
            setShowRejectForm("");
            setRejectionReason("");
            await refresh("Document rejected. The student can upload a replacement.");
        } catch (err) {
            setActionError(err.message || "Unable to reject document");
        } finally {
            setBusyRequestId("");
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <section className={isStaffView ? "order-2" : "order-3"}>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Attachments</h3>
                    {isStaffView ? (
                        <button type="button" onClick={() => setShowRequestForm((current) => !current)} disabled={isRequesting} className="primary-button rounded-xl px-3 py-2 text-xs font-semibold">
                            Request Document
                        </button>
                    ) : null}
                </div>
                {attachments.length ? (
                    <div className="space-y-2">
                        {attachments.map((attachment) => (
                            <div key={attachment._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--line) p-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">📄 {attachment.originalName}</p>
                                    <p className="text-xs text-slate-500">{formatFileSize(attachment.fileSize)} · {attachment.fileType?.toUpperCase()} · {formatDateTime(attachment.uploadedAt)}</p>
                                    <p className="text-xs text-slate-500">Uploaded by {attachment.uploadedBy?.name || "Unknown"}</p>
                                </div>
                                <AccessButton ticketId={ticketId} attachmentId={attachment._id} allowDownload />
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-slate-500 dark:text-slate-400">No attachments uploaded.</p>}
            </section>

            {showRequestForm ? (
                <form onSubmit={handleRequest} className="order-2 rounded-2xl border border-(--line) p-4">
                    <h4 className="font-semibold">Request Document</h4>
                    <div className="mt-3 space-y-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Document Name</label>
                            <input value={documentName} onChange={(event) => { setDocumentName(event.target.value); setRequestErrors((current) => ({ ...current, documentName: "" })); }} disabled={isRequesting} className="field-control w-full rounded-xl px-3 py-2 text-sm" placeholder="Document name, e.g. Fee Receipt" />
                            {requestErrors.documentName ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{requestErrors.documentName}</p> : null}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Additional Information / Message</label>
                            <textarea value={requestMessage} onChange={(event) => { setRequestMessage(event.target.value); setRequestErrors((current) => ({ ...current, message: "" })); }} disabled={isRequesting} rows={3} className="field-control w-full rounded-xl px-3 py-2 text-sm" placeholder="Please upload your latest fee receipt." />
                            {requestErrors.message ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{requestErrors.message}</p> : null}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowRequestForm(false)} disabled={isRequesting} className="rounded-xl border border-(--line) px-3 py-2 text-sm">Cancel</button>
                            <button type="submit" disabled={isRequesting} className="primary-button rounded-xl px-3 py-2 text-sm font-semibold">{isRequesting ? "Requesting..." : "Request Document"}</button>
                        </div>
                    </div>
                </form>
            ) : null}

            <section className={isStaffView ? "order-3" : "order-2"}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Document Requests</h3>
                {documentRequests.length ? <div className="space-y-3">
                    {documentRequests.map((request) => {
                        const latestSubmission = request.submissions?.[request.submissions.length - 1];
                        const canUpload = user?.role === "STUDENT" && ["PENDING", "REJECTED"].includes(request.status);
                        const canReview = isStaffView && request.status === "SUBMITTED";
                        const requestValidationMessage = validationMessage && canUpload ? validationMessage : "";
                        return (
                            <article key={request._id} className="rounded-2xl border border-(--line) p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="font-semibold">{request.documentName}</h4>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{request.message}</p>
                                        <p className="mt-2 text-xs text-slate-500">Requested by {request.requestedBy?.name || "Unknown"} · {formatDateTime(request.createdAt)}</p>
                                    </div>
                                    <DocumentStatusBadge status={request.status} />
                                </div>
                                {request.submissions?.length ? <div className="mt-3 space-y-2 border-t border-(--line) pt-3">
                                    {request.submissions.map((submission) => (
                                        <div key={submission._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                            <div className="min-w-0"><span className="truncate font-medium">{submission.originalName}</span><span className="ml-2 text-xs text-slate-500">{formatDateTime(submission.uploadedAt)} · {submission.uploadedBy?.name || "Unknown"}</span>{submission.rejectionReason ? <p className="text-xs text-red-600 dark:text-red-400">Reason: {submission.rejectionReason}</p> : null}</div>
                                            <AccessButton ticketId={ticketId} attachmentId={submission.attachment?._id || submission.attachment} allowDownload />
                                        </div>
                                    ))}
                                </div> : null}
                                {canUpload ? <div className="mt-4 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                                    <p className="text-sm font-semibold">{request.status === "REJECTED" ? "Document Rejected — Upload Again" : "Document Required"}</p>
                                    {request.status === "REJECTED" ? <p className="mt-1 text-xs text-red-600 dark:text-red-300">Please review the rejection reason above and upload a new file.</p> : null}
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <label className="cursor-pointer rounded-xl border border-(--line) px-3 py-2 text-sm font-semibold">Choose File<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => handleFileChange(request._id, event)} className="sr-only" /></label>
                                        {selectedFiles[request._id] ? <span className="max-w-full truncate text-sm">{selectedFiles[request._id].name} · {formatFileSize(selectedFiles[request._id].size)}</span> : null}
                                        <button type="button" onClick={() => handleSubmit(request)} disabled={busyRequestId === request._id} className="primary-button rounded-xl px-3 py-2 text-sm font-semibold">{busyRequestId === request._id ? "Uploading..." : "Upload Document"}</button>
                                    </div>
                                    {fileErrors[request._id] ? <p className="mt-2 text-sm text-red-600">{fileErrors[request._id]}</p> : null}
                                    {requestValidationMessage ? <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">⚠ {requestValidationMessage}</p> : null}
                                </div> : null}
                                {canReview && latestSubmission ? <div className="mt-4 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => handleAccept(request)} disabled={busyRequestId === request._id} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{busyRequestId === request._id ? "Saving..." : "Accept"}</button>
                                    <button type="button" onClick={() => setShowRejectForm((current) => current === request._id ? "" : request._id)} disabled={busyRequestId === request._id} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">Reject</button>
                                </div> : null}
                                {showRejectForm === request._id ? <div className="mt-3 space-y-2"><textarea value={rejectionReason} onChange={(event) => { setRejectionReason(event.target.value); setRejectionError(""); }} disabled={busyRequestId === request._id} rows={3} className="field-control w-full rounded-xl px-3 py-2 text-sm" placeholder="Rejection Reason" />{rejectionError ? <p className="text-sm text-red-600 dark:text-red-400">{rejectionError}</p> : null}<div className="flex justify-end gap-2"><button type="button" onClick={() => { setShowRejectForm(""); setRejectionError(""); }} className="rounded-xl border border-(--line) px-3 py-2 text-sm">Cancel</button><button type="button" onClick={() => handleReject(request)} disabled={busyRequestId === request._id} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white">{busyRequestId === request._id ? "Rejecting..." : "Reject Document"}</button></div></div> : null}
                            </article>
                        );
                    })}
                </div> : <p className="text-sm text-slate-500 dark:text-slate-400">No document requests yet.</p>}
            </section>
            {actionError ? <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p> : null}
            {actionMessage ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{actionMessage}</p> : null}
        </div>
    );
}

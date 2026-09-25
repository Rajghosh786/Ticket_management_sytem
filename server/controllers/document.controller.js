import mongoose from "mongoose";
import { Attachment } from "../models/Attachment.js";
import { DocumentRequest } from "../models/DocumentRequest.js";
import { Ticket } from "../models/Ticket.js";
import { createAuditLog } from "../services/audit.service.js";
import { formatAttachment, saveUploadedAttachment } from "../services/attachment.service.js";
import { getSignedAttachmentUrl } from "../services/cloudinary.service.js";
import { enrichTicketTiming, pauseTicketSla, resumeTicketSla } from "../services/sla.service.js";

const WAITING_DOCUMENT_STATUSES = ["PENDING", "REJECTED"];
const ACTIVE_DOCUMENT_TICKET_STATUSES = [
    "OPEN",
    "IN_PROGRESS",
    "PENDING_STUDENT_ACTION",
    "REOPENED",
];

function getTicketStudentId(ticket) {
    if (!ticket?.studentId) {
        return null;
    }

    if (typeof ticket.studentId === "object" && ticket.studentId._id) {
        return String(ticket.studentId._id);
    }

    return String(ticket.studentId);
}

function canUserAccessTicket(user, ticket) {
    if (user.role === "ADMIN") {
        return true;
    }

    if (user.role === "STUDENT") {
        return getTicketStudentId(ticket) === String(user._id);
    }

    if (user.role === "STAFF" || user.role === "DEPARTMENT_ADMIN") {
        return ticket.department === user.department;
    }

    return false;
}

function canManageDocuments(user, ticket) {
    if (user.role === "ADMIN") {
        return true;
    }

    if (user.role === "STAFF" || user.role === "DEPARTMENT_ADMIN") {
        return ticket.department === user.department;
    }

    return false;
}

function getStudentDisplayName(ticket) {
    if (ticket.studentName) {
        return ticket.studentName;
    }

    if (ticket.studentId && typeof ticket.studentId === "object") {
        return ticket.studentId.name || "student";
    }

    return "student";
}

async function hasWaitingDocumentRequests(ticketObjectId, excludeRequestId) {
    const query = {
        ticket: ticketObjectId,
        status: { $in: WAITING_DOCUMENT_STATUSES },
    };

    if (excludeRequestId) {
        query._id = { $ne: excludeRequestId };
    }

    return DocumentRequest.exists(query);
}

function applyWaitingDocumentState(ticket, waiting) {
    const fromStatus = ticket.status;

    if (!ACTIVE_DOCUMENT_TICKET_STATUSES.includes(ticket.status)) {
        return { changed: false, fromStatus, toStatus: ticket.status };
    }

    if (waiting) {
        pauseTicketSla(ticket);

        if (ticket.status !== "PENDING_STUDENT_ACTION") {
            ticket.status = "PENDING_STUDENT_ACTION";
            return { changed: true, fromStatus, toStatus: ticket.status };
        }

        return { changed: false, fromStatus, toStatus: ticket.status };
    }

    if (ticket.status === "PENDING_STUDENT_ACTION") {
        resumeTicketSla(ticket);
        ticket.status = "IN_PROGRESS";
        return { changed: true, fromStatus, toStatus: ticket.status };
    }

    return { changed: false, fromStatus, toStatus: ticket.status };
}

function formatSubmission(submission) {
    const attachment = submission.attachment;
    const attachmentPayload =
        attachment && typeof attachment === "object" && attachment._id
            ? formatAttachment(attachment)
            : { _id: attachment };

    return {
        _id: submission._id,
        attachment: attachmentPayload,
        originalName: submission.originalName,
        uploadedBy: submission.uploadedBy
            ? {
                  _id: submission.uploadedBy._id || submission.uploadedBy,
                  name: submission.uploadedBy.name,
                  role: submission.uploadedBy.role,
              }
            : null,
        uploadedAt: submission.uploadedAt,
        reviewStatus: submission.reviewStatus,
        rejectionReason: submission.rejectionReason || "",
        reviewedBy: submission.reviewedBy
            ? {
                  _id: submission.reviewedBy._id || submission.reviewedBy,
                  name: submission.reviewedBy.name,
                  role: submission.reviewedBy.role,
              }
            : null,
        reviewedAt: submission.reviewedAt,
    };
}

export function formatDocumentRequest(request) {
    return {
        _id: request._id,
        ticket: request.ticket,
        documentName: request.documentName,
        message: request.message,
        status: request.status,
        requestedBy: request.requestedBy
            ? {
                  _id: request.requestedBy._id || request.requestedBy,
                  name: request.requestedBy.name,
                  role: request.requestedBy.role,
              }
            : null,
        submissions: (request.submissions || []).map(formatSubmission),
        cancelledAt: request.cancelledAt,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
    };
}

export async function populateDocumentRequest(requestId) {
    return DocumentRequest.findById(requestId)
        .populate("requestedBy", "name role")
        .populate("cancelledBy", "name role")
        .populate("submissions.uploadedBy", "name role")
        .populate("submissions.reviewedBy", "name role")
        .populate("submissions.attachment");
}

async function loadAuthorizedTicket(req, res, { staffOnly = false } = {}) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid ticket id" });
        return null;
    }

    const ticket = await Ticket.findById(id).populate("studentId", "name email rollNo");

    if (!ticket) {
        res.status(404).json({ message: "Ticket not found" });
        return null;
    }

    if (staffOnly) {
        if (!canManageDocuments(req.user, ticket)) {
            res.status(403).json({ message: "You do not have access to this ticket" });
            return null;
        }
    } else if (!canUserAccessTicket(req.user, ticket)) {
        res.status(403).json({ message: "You do not have access to this ticket" });
        return null;
    }

    return ticket;
}

function cloudinaryFailureMessage(error) {
    if (error?.message === "Cloudinary is not configured") {
        return "File upload is not configured";
    }

    return "Unable to upload file to Cloudinary";
}

export async function uploadTicketAttachment(req, res) {
    try {
        const ticket = await loadAuthorizedTicket(req, res);

        if (!ticket) {
            return;
        }

        if (req.user.role !== "STUDENT" || getTicketStudentId(ticket) !== String(req.user._id)) {
            return res.status(403).json({ message: "Only the ticket owner can upload an attachment" });
        }

        if (!ACTIVE_DOCUMENT_TICKET_STATUSES.includes(ticket.status)) {
            return res.status(400).json({
                message: "Attachments cannot be added to a resolved or closed ticket",
            });
        }

        let attachment;
        try {
            attachment = await saveUploadedAttachment({
                file: req.file,
                ticket,
                user: req.user,
            });
        } catch (error) {
            console.error("Attachment upload error:", error);
            return res.status(502).json({ message: cloudinaryFailureMessage(error) });
        }

        await createAuditLog({
            ticketId: ticket._id,
            action: "DOCUMENT_UPLOADED",
            performedBy: req.user._id,
            fromStatus: ticket.status,
            toStatus: ticket.status,
            details: `${req.user.name} uploaded ${attachment.originalName}.`,
        });

        return res.status(201).json({
            attachment: formatAttachment(attachment),
            ticket: enrichTicketTiming(ticket),
        });
    } catch (error) {
        console.error("Upload ticket attachment error:", error);
        return res.status(500).json({ message: "Unable to upload attachment" });
    }
}

export async function createDocumentRequest(req, res) {
    try {
        const ticket = await loadAuthorizedTicket(req, res, { staffOnly: true });

        if (!ticket) {
            return;
        }

        if (!ACTIVE_DOCUMENT_TICKET_STATUSES.includes(ticket.status)) {
            return res.status(400).json({
                message: "Documents can only be requested on an active ticket",
            });
        }

        const documentName = String(req.body.documentName || "").trim();
        const message = String(req.body.message || "").trim();

        if (!documentName) {
            return res.status(400).json({ message: "Requested document name is required" });
        }

        if (!message) {
            return res.status(400).json({ message: "A message is required" });
        }

        const documentRequest = await DocumentRequest.create({
            ticket: ticket._id,
            documentName,
            message,
            requestedBy: req.user._id,
            status: "PENDING",
            submissions: [],
        });

        const fromStatus = ticket.status;
        const stateChange = applyWaitingDocumentState(ticket, true);
        await ticket.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "DOCUMENT_REQUESTED",
            performedBy: req.user._id,
            fromStatus,
            toStatus: ticket.status,
            details: `${req.user.name} requested ${documentName} from ${getStudentDisplayName(ticket)}.`,
        });

        if (stateChange.changed) {
            await createAuditLog({
                ticketId: ticket._id,
                action: "STATUS_CHANGED",
                performedBy: req.user._id,
                fromStatus: stateChange.fromStatus,
                toStatus: stateChange.toStatus,
                details: "Ticket waiting for requested document. SLA paused.",
            });
        }

        const populated = await populateDocumentRequest(documentRequest._id);

        return res.status(201).json({
            documentRequest: formatDocumentRequest(populated),
            ticket: enrichTicketTiming(ticket),
        });
    } catch (error) {
        console.error("Create document request error:", error);
        return res.status(500).json({ message: "Unable to create document request" });
    }
}

export async function getDocumentRequests(req, res) {
    try {
        const ticket = await loadAuthorizedTicket(req, res);

        if (!ticket) {
            return;
        }

        const requests = await DocumentRequest.find({ ticket: ticket._id })
            .populate("requestedBy", "name role")
            .populate("cancelledBy", "name role")
            .populate("submissions.uploadedBy", "name role")
            .populate("submissions.reviewedBy", "name role")
            .populate("submissions.attachment")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            documentRequests: requests.map(formatDocumentRequest),
        });
    } catch (error) {
        console.error("Get document requests error:", error);
        return res.status(500).json({ message: "Unable to load document requests" });
    }
}

export async function submitDocumentRequest(req, res) {
    try {
        const ticket = await loadAuthorizedTicket(req, res);

        if (!ticket) {
            return;
        }

        if (req.user.role !== "STUDENT" || getTicketStudentId(ticket) !== String(req.user._id)) {
            return res.status(403).json({ message: "Only the ticket owner can submit a requested document" });
        }

        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid document request id" });
        }

        const documentRequest = await DocumentRequest.findById(requestId);

        if (!documentRequest || String(documentRequest.ticket) !== String(ticket._id)) {
            return res.status(404).json({ message: "Document request not found for this ticket" });
        }

        if (!["PENDING", "REJECTED"].includes(documentRequest.status)) {
            return res.status(400).json({
                message: `Cannot upload a document while the request is ${documentRequest.status}`,
            });
        }

        let attachment;
        try {
            attachment = await saveUploadedAttachment({
                file: req.file,
                ticket,
                user: req.user,
                documentRequestId: documentRequest._id,
            });
        } catch (error) {
            console.error("Document submission upload error:", error);
            return res.status(502).json({ message: cloudinaryFailureMessage(error) });
        }

        documentRequest.submissions.push({
            attachment: attachment._id,
            originalName: attachment.originalName,
            uploadedBy: req.user._id,
            uploadedAt: attachment.uploadedAt,
            reviewStatus: "SUBMITTED",
            rejectionReason: "",
            reviewedBy: null,
            reviewedAt: null,
        });
        documentRequest.status = "SUBMITTED";

        try {
            await documentRequest.save();
        } catch (error) {
            console.error("Document request save error:", error);
            return res.status(500).json({ message: "Unable to save document submission" });
        }

        const waiting = await hasWaitingDocumentRequests(ticket._id);
        const fromStatus = ticket.status;
        const stateChange = applyWaitingDocumentState(ticket, Boolean(waiting));
        await ticket.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "DOCUMENT_UPLOADED",
            performedBy: req.user._id,
            fromStatus,
            toStatus: ticket.status,
            details: `${req.user.name} uploaded ${attachment.originalName}.`,
        });

        if (stateChange.changed) {
            await createAuditLog({
                ticketId: ticket._id,
                action: "STATUS_CHANGED",
                performedBy: req.user._id,
                fromStatus: stateChange.fromStatus,
                toStatus: stateChange.toStatus,
                details: waiting
                    ? "Ticket still waiting for another requested document. SLA remains paused."
                    : "Requested document submitted. SLA resumed.",
            });
        }

        const populated = await populateDocumentRequest(documentRequest._id);

        return res.status(200).json({
            documentRequest: formatDocumentRequest(populated),
            ticket: enrichTicketTiming(ticket),
        });
    } catch (error) {
        console.error("Submit document request error:", error);
        return res.status(500).json({ message: "Unable to submit document" });
    }
}

export async function acceptDocumentRequest(req, res) {
    try {
        const ticket = await loadAuthorizedTicket(req, res, { staffOnly: true });

        if (!ticket) {
            return;
        }

        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid document request id" });
        }

        const documentRequest = await DocumentRequest.findById(requestId);

        if (!documentRequest || String(documentRequest.ticket) !== String(ticket._id)) {
            return res.status(404).json({ message: "Document request not found for this ticket" });
        }

        if (documentRequest.status !== "SUBMITTED") {
            return res.status(400).json({
                message: "Only a submitted document can be accepted",
            });
        }

        const latestSubmission = documentRequest.submissions[documentRequest.submissions.length - 1];

        if (!latestSubmission) {
            return res.status(400).json({ message: "No document has been submitted" });
        }

        latestSubmission.reviewStatus = "ACCEPTED";
        latestSubmission.reviewedBy = req.user._id;
        latestSubmission.reviewedAt = new Date();
        documentRequest.status = "ACCEPTED";
        await documentRequest.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "DOCUMENT_ACCEPTED",
            performedBy: req.user._id,
            fromStatus: ticket.status,
            toStatus: ticket.status,
            details: `${req.user.name} accepted ${latestSubmission.originalName}.`,
        });

        const populated = await populateDocumentRequest(documentRequest._id);

        return res.status(200).json({
            documentRequest: formatDocumentRequest(populated),
            ticket: enrichTicketTiming(ticket),
        });
    } catch (error) {
        console.error("Accept document request error:", error);
        return res.status(500).json({ message: "Unable to accept document" });
    }
}

export async function rejectDocumentRequest(req, res) {
    try {
        const ticket = await loadAuthorizedTicket(req, res, { staffOnly: true });

        if (!ticket) {
            return;
        }

        const { requestId } = req.params;
        const reason = String(req.body.reason || req.body.rejectionReason || "").trim();

        if (!reason) {
            return res.status(400).json({ message: "A rejection reason is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid document request id" });
        }

        const documentRequest = await DocumentRequest.findById(requestId);

        if (!documentRequest || String(documentRequest.ticket) !== String(ticket._id)) {
            return res.status(404).json({ message: "Document request not found for this ticket" });
        }

        if (documentRequest.status !== "SUBMITTED") {
            return res.status(400).json({
                message: "Only a submitted document can be rejected",
            });
        }

        const latestSubmission = documentRequest.submissions[documentRequest.submissions.length - 1];

        if (!latestSubmission) {
            return res.status(400).json({ message: "No document has been submitted" });
        }

        latestSubmission.reviewStatus = "REJECTED";
        latestSubmission.rejectionReason = reason;
        latestSubmission.reviewedBy = req.user._id;
        latestSubmission.reviewedAt = new Date();
        documentRequest.status = "REJECTED";
        await documentRequest.save();

        const fromStatus = ticket.status;
        const stateChange = applyWaitingDocumentState(ticket, true);
        await ticket.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "DOCUMENT_REJECTED",
            performedBy: req.user._id,
            fromStatus,
            toStatus: ticket.status,
            details: `${req.user.name} rejected ${latestSubmission.originalName}. Reason: ${reason}`,
        });

        if (stateChange.changed) {
            await createAuditLog({
                ticketId: ticket._id,
                action: "STATUS_CHANGED",
                performedBy: req.user._id,
                fromStatus: stateChange.fromStatus,
                toStatus: stateChange.toStatus,
                details: "Document rejected. Waiting for a new upload. SLA paused.",
            });
        }

        const populated = await populateDocumentRequest(documentRequest._id);

        return res.status(200).json({
            documentRequest: formatDocumentRequest(populated),
            ticket: enrichTicketTiming(ticket),
        });
    } catch (error) {
        console.error("Reject document request error:", error);
        return res.status(500).json({ message: "Unable to reject document" });
    }
}

export async function cancelDocumentRequest(req, res) {
    try {
        const ticket = await loadAuthorizedTicket(req, res, { staffOnly: true });

        if (!ticket) {
            return;
        }

        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid document request id" });
        }

        const documentRequest = await DocumentRequest.findById(requestId);

        if (!documentRequest || String(documentRequest.ticket) !== String(ticket._id)) {
            return res.status(404).json({ message: "Document request not found for this ticket" });
        }

        if (!["PENDING", "REJECTED"].includes(documentRequest.status)) {
            return res.status(400).json({
                message: `Cannot cancel a document request that is ${documentRequest.status}`,
            });
        }

        documentRequest.status = "CANCELLED";
        documentRequest.cancelledAt = new Date();
        documentRequest.cancelledBy = req.user._id;
        await documentRequest.save();

        const waiting = await hasWaitingDocumentRequests(ticket._id);
        const fromStatus = ticket.status;
        const stateChange = applyWaitingDocumentState(ticket, Boolean(waiting));
        await ticket.save();

        await createAuditLog({
            ticketId: ticket._id,
            action: "DOCUMENT_REQUEST_CANCELLED",
            performedBy: req.user._id,
            fromStatus,
            toStatus: ticket.status,
            details: `${req.user.name} cancelled the ${documentRequest.documentName} request.`,
        });

        if (stateChange.changed) {
            await createAuditLog({
                ticketId: ticket._id,
                action: "STATUS_CHANGED",
                performedBy: req.user._id,
                fromStatus: stateChange.fromStatus,
                toStatus: stateChange.toStatus,
                details: waiting
                    ? "Another document request is still waiting. SLA remains paused."
                    : "Document request cancelled. SLA resumed.",
            });
        }

        const populated = await populateDocumentRequest(documentRequest._id);

        return res.status(200).json({
            documentRequest: formatDocumentRequest(populated),
            ticket: enrichTicketTiming(ticket),
        });
    } catch (error) {
        console.error("Cancel document request error:", error);
        return res.status(500).json({ message: "Unable to cancel document request" });
    }
}

export async function getAttachmentAccess(req, res) {
    try {
        const ticket = await loadAuthorizedTicket(req, res);

        if (!ticket) {
            return;
        }

        const { attachmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
            return res.status(400).json({ message: "Invalid attachment id" });
        }

        const attachment = await Attachment.findById(attachmentId);

        if (!attachment || String(attachment.ticketId) !== String(ticket._id)) {
            return res.status(404).json({ message: "Attachment not found for this ticket" });
        }

        let signed;
        try {
            signed = getSignedAttachmentUrl(attachment);
        } catch (error) {
            console.error("Signed URL error:", error);
            return res.status(502).json({ message: cloudinaryFailureMessage(error) });
        }

        return res.status(200).json({
            attachment: formatAttachment(attachment),
            url: signed.url,
            expiresAt: signed.expiresAt,
            expiresInSeconds: signed.expiresInSeconds,
        });
    } catch (error) {
        console.error("Get attachment access error:", error);
        return res.status(500).json({ message: "Unable to access attachment" });
    }
}

export async function getTicketAttachments(ticketObjectId) {
    const attachments = await Attachment.find({
        ticketId: ticketObjectId,
        documentRequestId: null,
    })
        .populate("uploadedBy", "name role")
        .sort({ uploadedAt: 1 })
        .lean();

    return attachments.map((attachment) => ({
        ...formatAttachment(attachment),
        uploadedBy: attachment.uploadedBy
            ? {
                  _id: attachment.uploadedBy._id,
                  name: attachment.uploadedBy.name,
                  role: attachment.uploadedBy.role,
              }
            : null,
    }));
}

export async function getTicketDocumentRequests(ticketObjectId) {
    const requests = await DocumentRequest.find({ ticket: ticketObjectId })
        .populate("requestedBy", "name role")
        .populate("cancelledBy", "name role")
        .populate("submissions.uploadedBy", "name role")
        .populate("submissions.reviewedBy", "name role")
        .populate("submissions.attachment")
        .sort({ createdAt: 1 });

    return requests.map(formatDocumentRequest);
}

export async function ticketHasWaitingDocumentRequests(ticketObjectId) {
    return hasWaitingDocumentRequests(ticketObjectId);
}

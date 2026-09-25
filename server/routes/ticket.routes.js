import { Router } from "express";
import {
    closeTicket,
    createTicket,
    getTicketById,
    getTickets,
    reopenTicket,
    respondToPendingAction,
    changeTicketStatus,
    changeTicketPriority,
    takeTicket,
    getStaffKpis,
    assignTicket,
    getDepartmentAdminKpis,
} from "../controllers/ticket.controller.js";
import {
    acceptDocumentRequest,
    cancelDocumentRequest,
    createDocumentRequest,
    getAttachmentAccess,
    getDocumentRequests,
    rejectDocumentRequest,
    submitDocumentRequest,
    uploadTicketAttachment,
} from "../controllers/document.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";
import { optionalTicketFile, requireUploadedFile } from "../middleware/upload.middleware.js";

const ticketRouter = Router();

ticketRouter.use(authenticate);

ticketRouter.get("/kpis/staff", requireRoles("STAFF"), getStaffKpis);
ticketRouter.get("/kpis/department-admin", requireRoles("DEPARTMENT_ADMIN"), getDepartmentAdminKpis);

// Student routes
ticketRouter.post("/", requireRoles("STUDENT"), optionalTicketFile, createTicket);
ticketRouter.patch("/:id/close", requireRoles("STUDENT"), closeTicket);
ticketRouter.patch("/:id/reopen", requireRoles("STUDENT"), reopenTicket);
ticketRouter.patch("/:id/respond", requireRoles("STUDENT"), respondToPendingAction);
ticketRouter.post(
    "/:id/attachments",
    requireRoles("STUDENT"),
    requireUploadedFile,
    uploadTicketAttachment
);
ticketRouter.post(
    "/:id/document-requests/:requestId/submit",
    requireRoles("STUDENT"),
    requireUploadedFile,
    submitDocumentRequest
);

// Staff / Department Admin / Admin document workflow
ticketRouter.post(
    "/:id/document-requests",
    requireRoles("STAFF", "DEPARTMENT_ADMIN", "ADMIN"),
    createDocumentRequest
);
ticketRouter.patch(
    "/:id/document-requests/:requestId/accept",
    requireRoles("STAFF", "DEPARTMENT_ADMIN", "ADMIN"),
    acceptDocumentRequest
);
ticketRouter.patch(
    "/:id/document-requests/:requestId/reject",
    requireRoles("STAFF", "DEPARTMENT_ADMIN", "ADMIN"),
    rejectDocumentRequest
);
ticketRouter.patch(
    "/:id/document-requests/:requestId/cancel",
    requireRoles("STAFF", "DEPARTMENT_ADMIN", "ADMIN"),
    cancelDocumentRequest
);

ticketRouter.get("/:id/document-requests", getDocumentRequests);
ticketRouter.get("/:id/attachments/:attachmentId", getAttachmentAccess);

// Staff routes
ticketRouter.patch("/:id/status", requireRoles("STAFF"), changeTicketStatus);
ticketRouter.patch("/:id/priority", requireRoles("STAFF", "DEPARTMENT_ADMIN"), changeTicketPriority);
ticketRouter.patch("/:id/take", requireRoles("STAFF"), takeTicket);

// Department Admin routes
ticketRouter.patch("/:id/assign", requireRoles("DEPARTMENT_ADMIN"), assignTicket);

// Shared routes (role-based filtering happens inside the controller)
ticketRouter.get("/", getTickets);
ticketRouter.get("/:id", getTicketById);

export default ticketRouter;

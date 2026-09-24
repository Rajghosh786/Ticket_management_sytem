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
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const ticketRouter = Router();

ticketRouter.use(authenticate);

// Student routes
ticketRouter.post("/", requireRoles("STUDENT"), createTicket);
ticketRouter.patch("/:id/close", requireRoles("STUDENT"), closeTicket);
ticketRouter.patch("/:id/reopen", requireRoles("STUDENT"), reopenTicket);
ticketRouter.patch("/:id/respond", requireRoles("STUDENT"), respondToPendingAction);

// Staff routes
ticketRouter.patch("/:id/status", requireRoles("STAFF"), changeTicketStatus);
ticketRouter.patch("/:id/priority", requireRoles("STAFF", "DEPARTMENT_ADMIN"), changeTicketPriority);
ticketRouter.patch("/:id/take", requireRoles("STAFF"), takeTicket);
ticketRouter.get("/kpis/staff", requireRoles("STAFF"), getStaffKpis);

// Department Admin routes
ticketRouter.patch("/:id/assign", requireRoles("DEPARTMENT_ADMIN"), assignTicket);
ticketRouter.get("/kpis/department-admin", requireRoles("DEPARTMENT_ADMIN"), getDepartmentAdminKpis);

// Shared routes (role-based filtering happens inside the controller)
ticketRouter.get("/", getTickets);
ticketRouter.get("/:id", getTicketById);

export default ticketRouter;

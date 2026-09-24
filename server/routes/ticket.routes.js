import { Router } from "express";
import {
    closeTicket,
    createTicket,
    getTicketById,
    getTickets,
    reopenTicket,
} from "../controllers/ticket.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const ticketRouter = Router();

ticketRouter.use(authenticate);

ticketRouter.post("/", requireRoles("STUDENT"), createTicket);
ticketRouter.get("/", getTickets);
ticketRouter.get("/:id", getTicketById);
ticketRouter.patch("/:id/close", requireRoles("STUDENT"), closeTicket);
ticketRouter.patch("/:id/reopen", requireRoles("STUDENT"), reopenTicket);

export default ticketRouter;

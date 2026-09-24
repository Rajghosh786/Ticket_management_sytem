import { Router } from "express";
import { getAnalyticsKpis } from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.get("/kpis", requireRoles("ADMIN"), getAnalyticsKpis);

export default analyticsRouter;

import { Router } from "express";
import { getDepartmentStaff } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/role.middleware.js";

const userRouter = Router();

userRouter.use(authenticate);
userRouter.get("/staff", requireRoles("DEPARTMENT_ADMIN"), getDepartmentStaff);

export default userRouter;

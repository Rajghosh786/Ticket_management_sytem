import { Router } from "express";
import { getCurrentUser, login, logout } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/me", getCurrentUser);
authRouter.post("/logout", logout);

export default authRouter;

import { Router } from "express";
import { getCurrentUser, login, logout, registerStudent } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/register", registerStudent);
authRouter.get("/me", getCurrentUser);
authRouter.post("/logout", logout);

export default authRouter;

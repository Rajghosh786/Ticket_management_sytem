import { config } from "dotenv";
config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.config.js";
import authRouter from "./routes/auth.routes.js";
import ticketRouter from "./routes/ticket.routes.js";
import userRouter from "./routes/user.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import { handleUploadError } from "./middleware/upload.middleware.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    })
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/users", userRouter);
app.use("/api/analytics", analyticsRouter);

app.use(handleUploadError);

app.use((err, _req, res, _next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid request body" });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
});

const startServer = async () => {
    await connectDB();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

startServer();

import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import {
    buildAuthCookie,
    buildClearAuthCookie,
    getAuthTokenFromRequest,
} from "../utils/cookies.js";
import { JWT_MAX_AGE_SECONDS, signAuthToken, verifyAuthToken } from "../utils/jwt.util.js";
import { toSafeUser } from "../utils/user.util.js";

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = signAuthToken(user._id);
        res.setHeader("Set-Cookie", buildAuthCookie(token, JWT_MAX_AGE_SECONDS));

        return res.status(200).json({ user: toSafeUser(user) });
    } catch (error) {
        if (error.message === "JWT_SECRET is not configured") {
            return res.status(500).json({ message: "Server authentication is not configured" });
        }
        console.error("Login error:", error);
        return res.status(500).json({ message: "Unable to sign in" });
    }
}

export async function registerStudent(req, res) {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        const rollNo = String(req.body.rollNo || "").trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "A valid email is required" });
        }

        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        if (!rollNo) {
            return res.status(400).json({ message: "Roll number is required" });
        }

        const existingUser = await User.findOne({ email }).select("_id");
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const displayName = email.split("@")[0];
        const user = await User.create({
            name: displayName,
            email,
            password: passwordHash,
            rollNo,
            role: "STUDENT",
        });

        return res.status(201).json({ user: toSafeUser(user) });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }
        console.error("Student registration error:", error);
        return res.status(500).json({ message: "Unable to create student account" });
    }
}

export async function getCurrentUser(req, res) {
    try {
        const token = getAuthTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        let decoded;
        try {
            decoded = verifyAuthToken(token);
        } catch {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        return res.status(200).json({ user: toSafeUser(user) });
    } catch (error) {
        if (error.message === "JWT_SECRET is not configured") {
            return res.status(500).json({ message: "Server authentication is not configured" });
        }
        console.error("Get current user error:", error);
        return res.status(500).json({ message: "Unable to load session" });
    }
}

export function logout(_req, res) {
    res.setHeader("Set-Cookie", buildClearAuthCookie());
    return res.status(200).json({ message: "Logged out" });
}

import { User } from "../models/User.js";
import { getAuthTokenFromRequest } from "../utils/cookies.js";
import { verifyAuthToken } from "../utils/jwt.util.js";

export async function authenticate(req, res, next) {
    try {
        const token = getAuthTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        let decoded;
        try {
            decoded = verifyAuthToken(token);
        } catch {
            return res.status(401).json({ message: "Invalid or expired session" });
        }

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Invalid or expired session" });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        next(error);
    }
}

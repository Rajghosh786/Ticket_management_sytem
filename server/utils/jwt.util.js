import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = "7d";
const JWT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
}

export function signAuthToken(userId) {
    return jwt.sign({ userId: String(userId) }, getJwtSecret(), {
        expiresIn: JWT_EXPIRES_IN,
    });
}

export function verifyAuthToken(token) {
    return jwt.verify(token, getJwtSecret());
}

export { JWT_MAX_AGE_SECONDS };

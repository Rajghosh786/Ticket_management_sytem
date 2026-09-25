const AUTH_COOKIE_NAME = "token";

export function parseCookies(req) {
    const header = req.headers.cookie;
    if (!header) {
        return {};
    }

    return header.split(";").reduce((cookies, part) => {
        const trimmed = part.trim();
        const separator = trimmed.indexOf("=");
        if (separator === -1) {
            return cookies;
        }

        const name = trimmed.slice(0, separator);
        const value = trimmed.slice(separator + 1);
        cookies[name] = decodeURIComponent(value);
        return cookies;
    }, {});
}

export function getAuthTokenFromRequest(req) {
    const cookies = parseCookies(req);
    return cookies[AUTH_COOKIE_NAME] || null;
}

export function buildAuthCookie(token, maxAgeSeconds) {
    const parts = [
        `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
        "HttpOnly",
        "Path=/",
        process.env.NODE_ENV === "production"
        ? "SameSite=None"
        : "SameSite=Lax",
        `Max-Age=${maxAgeSeconds}`,
    ];

    if (process.env.NODE_ENV === "production") {
        parts.push("Secure");
    }

    return parts.join("; ");
}

export function buildClearAuthCookie() {
    const parts = [
        `${AUTH_COOKIE_NAME}=`,
        "HttpOnly",
        "Path=/",
        process.env.NODE_ENV === "production"
        ? "SameSite=None"
        : "SameSite=Lax",
        "Max-Age=0",
    ];

    if (process.env.NODE_ENV === "production") {
        parts.push("Secure");
    }

    return parts.join("; ");
}

export { AUTH_COOKIE_NAME };

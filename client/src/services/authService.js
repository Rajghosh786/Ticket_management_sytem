import { apiRequest } from "../lib/api.js";

export async function loginWithCredentials(email, password) {
    const { response, data } = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const message = data?.message || "Unable to sign in";
        throw new Error(message);
    }

    return data.user;
}

export async function registerStudentAccount({ email, password, rollNo }) {
    const { response, data } = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, rollNo }),
    });

    if (!response.ok) {
        const message = data?.message || "Unable to create student account";
        throw new Error(message);
    }

    return data.user;
}

export async function fetchCurrentUser() {
    const { response, data } = await apiRequest("/api/auth/me", {
        method: "GET",
    });

    if (response.status === 401) {
        return null;
    }

    if (!response.ok) {
        const message = data?.message || "Unable to load session";
        throw new Error(message);
    }

    return data.user;
}

export async function logoutSession() {
    const { response, data } = await apiRequest("/api/auth/logout", {
        method: "POST",
    });

    if (!response.ok) {
        const message = data?.message || "Unable to log out";
        throw new Error(message);
    }
}

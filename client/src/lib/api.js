const API_BASE_URL = import.meta.env.VITE_API_URL;

function getApiBaseUrl() {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_URL is not configured");
    }
    return API_BASE_URL.replace(/\/$/, "");
}

export async function apiRequest(path, options = {}) {
    const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers,
    });

    let data = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        data = await response.json();
    }

    return { response, data };
}

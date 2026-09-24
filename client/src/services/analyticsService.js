import { apiRequest } from "../lib/api.js";

async function parseApiError(response, data, fallbackMessage) {
    const message = data?.message || fallbackMessage;
    const error = new Error(message);
    error.status = response.status;
    throw error;
}

export async function fetchAnalyticsKpis() {
    const { response, data } = await apiRequest("/api/analytics/kpis", {
        method: "GET",
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to load analytics");
    }

    return data;
}

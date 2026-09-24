import { apiRequest } from "../lib/api.js";

async function parseApiError(response, data, fallbackMessage) {
    const message = data?.message || fallbackMessage;
    const error = new Error(message);
    error.status = response.status;
    throw error;
}

export async function fetchDepartmentStaff() {
    const { response, data } = await apiRequest("/api/users/staff", {
        method: "GET",
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to load department staff");
    }

    return data.staff || [];
}

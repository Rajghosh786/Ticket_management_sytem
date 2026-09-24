import { apiRequest } from "../lib/api.js";

async function parseApiError(response, data, fallbackMessage) {
    const message = data?.message || fallbackMessage;
    const error = new Error(message);
    error.status = response.status;
    throw error;
}

export async function fetchTickets(query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });

    const queryString = params.toString();
    const path = queryString ? `/api/tickets?${queryString}` : "/api/tickets";

    const { response, data } = await apiRequest(path, { method: "GET" });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to load tickets");
    }

    return data;
}

export async function fetchTicketById(ticketId) {
    const { response, data } = await apiRequest(`/api/tickets/${ticketId}`, {
        method: "GET",
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to load ticket details");
    }

    return data;
}

export async function createTicket(payload) {
    const { response, data } = await apiRequest("/api/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to create ticket");
    }

    return data.ticket;
}

export async function closeTicket(ticketId) {
    const { response, data } = await apiRequest(`/api/tickets/${ticketId}/close`, {
        method: "PATCH",
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to close ticket");
    }

    return data.ticket;
}

export async function reopenTicket(ticketId, reopenReason) {
    const { response, data } = await apiRequest(`/api/tickets/${ticketId}/reopen`, {
        method: "PATCH",
        body: JSON.stringify({ reopenReason }),
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to reopen ticket");
    }

    return data.ticket;
}

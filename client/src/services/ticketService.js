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
        if (value !== undefined && value !== null && value !== "") {
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

export async function respondToPendingAction(ticketId, response) {
    const { response: apiResponse, data } = await apiRequest(`/api/tickets/${ticketId}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ response }),
    });

    if (!apiResponse.ok) {
        await parseApiError(apiResponse, data, "Unable to submit response");
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

// Staff workflow functions

export async function changeTicketStatus(ticketId, payload) {
    const { response, data } = await apiRequest(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to update ticket status");
    }

    return data.ticket;
}

export async function changeTicketPriority(ticketId, priority) {
    const { response, data } = await apiRequest(`/api/tickets/${ticketId}/priority`, {
        method: "PATCH",
        body: JSON.stringify({ priority }),
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to update ticket priority");
    }

    return data.ticket;
}

export async function takeTicket(ticketId) {
    const { response, data } = await apiRequest(`/api/tickets/${ticketId}/take`, {
        method: "PATCH",
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to take ticket");
    }

    return data.ticket;
}

export async function fetchStaffKpis() {
    const { response, data } = await apiRequest("/api/tickets/kpis/staff", {
        method: "GET",
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to load KPIs");
    }

    return data;
}

export async function fetchDepartmentAdminKpis() {
    const { response, data } = await apiRequest("/api/tickets/kpis/department-admin", {
        method: "GET",
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to load KPIs");
    }

    return data;
}

export async function assignTicket(ticketId, assignedTo) {
    const { response, data } = await apiRequest(`/api/tickets/${ticketId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ assignedTo }),
    });

    if (!response.ok) {
        await parseApiError(response, data, "Unable to assign ticket");
    }

    return data.ticket;
}

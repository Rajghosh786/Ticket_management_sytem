export const SLA_POLICY = {
    FEES: {
        hours: 48,
        department: "Accounts",
    },
    ATTENDANCE: {
        hours: 24,
        department: "Academic Office",
    },
    CERTIFICATES: {
        hours: 72,
        department: "Registrar",
    },
    IT_SUPPORT: {
        hours: 12,
        department: "IT Helpdesk",
    },
};

export const TICKET_CATEGORIES = Object.keys(SLA_POLICY);
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

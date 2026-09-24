import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        fromStatus: {
            type: String,
            default: "",
        },
        toStatus: {
            type: String,
            default: "",
        },
        details: {
            type: String,
            default: "",
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);

import mongoose from "mongoose";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "../constants/sla.policy.js";

const ticketStatuses = [
    "OPEN",
    "IN_PROGRESS",
    "PENDING_STUDENT_ACTION",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
];

const slaStatuses = ["WITHIN_SLA", "AT_RISK", "BREACHED"];

const ticketSchema = new mongoose.Schema(
    {
        ticketId: {
            type: String,
            required: true,
            unique: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: TICKET_CATEGORIES,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        priority: {
            type: String,
            enum: TICKET_PRIORITIES,
            default: "MEDIUM",
        },
        status: {
            type: String,
            enum: ticketStatuses,
            default: "OPEN",
        },
        department: {
            type: String,
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        slaHours: {
            type: Number,
            required: true,
        },
        slaDeadline: {
            type: Date,
            required: true,
        },
        slaPausedAt: {
            type: Date,
            default: null,
        },
        totalPausedDuration: {
            type: Number,
            default: 0,
        },
        isBreached: {
            type: Boolean,
            default: false,
        },
        slaStatus: {
            type: String,
            enum: slaStatuses,
            default: "WITHIN_SLA",
        },
        resolutionNotes: {
            type: String,
            default: "",
        },
        resolvedAt: {
            type: Date,
            default: null,
        },
        closedAt: {
            type: Date,
            default: null,
        },
        reopenedAt: {
            type: Date,
            default: null,
        },
        reopenReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export const Ticket = mongoose.model("Ticket", ticketSchema);

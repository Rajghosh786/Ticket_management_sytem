import mongoose from "mongoose";

export const DOCUMENT_REQUEST_STATUSES = [
    "PENDING",
    "SUBMITTED",
    "ACCEPTED",
    "REJECTED",
    "CANCELLED",
];

const submissionSchema = new mongoose.Schema(
    {
        attachment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Attachment",
            required: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        reviewStatus: {
            type: String,
            enum: ["SUBMITTED", "ACCEPTED", "REJECTED"],
            default: "SUBMITTED",
        },
        rejectionReason: {
            type: String,
            default: "",
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { _id: true }
);

const documentRequestSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },
        documentName: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: DOCUMENT_REQUEST_STATUSES,
            default: "PENDING",
        },
        submissions: {
            type: [submissionSchema],
            default: [],
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export const DocumentRequest = mongoose.model("DocumentRequest", documentRequestSchema);

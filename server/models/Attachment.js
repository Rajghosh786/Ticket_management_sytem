import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
    {
        originalName: {
            type: String,
            required: true,
            trim: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
        cloudinaryPublicId: {
            type: String,
            required: true,
        },
        resourceType: {
            type: String,
            required: true,
        },
        format: {
            type: String,
            default: "",
        },
        deliveryType: {
            type: String,
            default: "private",
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
        ticketId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },
        documentRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DocumentRequest",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export const Attachment = mongoose.model("Attachment", attachmentSchema);

import { Attachment } from "../models/Attachment.js";
import { getFileExtension } from "../middleware/upload.middleware.js";
import { destroyCloudinaryFile, uploadBufferToCloudinary } from "./cloudinary.service.js";

export function formatAttachment(attachment) {
    if (!attachment) {
        return null;
    }

    return {
        _id: attachment._id,
        originalName: attachment.originalName,
        fileType: attachment.fileType,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        resourceType: attachment.resourceType,
        uploadedBy: attachment.uploadedBy,
        uploadedAt: attachment.uploadedAt,
        ticketId: attachment.ticketId,
        documentRequestId: attachment.documentRequestId || null,
    };
}

export async function saveUploadedAttachment({ file, ticket, user, documentRequestId = null }) {
    const uploadResult = await uploadBufferToCloudinary(file, `ticketmanager/${ticket.ticketId}`);
    const extension = getFileExtension(file.originalname).replace(".", "") || uploadResult.format || "file";

    try {
        const attachment = await Attachment.create({
            originalName: file.originalname,
            fileType: extension,
            mimeType: file.mimetype,
            fileSize: file.size,
            cloudinaryPublicId: uploadResult.public_id,
            resourceType: uploadResult.resource_type,
            format: uploadResult.format || extension,
            deliveryType: uploadResult.type || "private",
            uploadedBy: user._id,
            uploadedAt: new Date(),
            ticketId: ticket._id,
            documentRequestId,
        });

        return attachment;
    } catch (error) {
        await destroyCloudinaryFile(uploadResult.public_id, uploadResult.resource_type);
        throw error;
    }
}

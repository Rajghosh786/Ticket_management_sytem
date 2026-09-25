import { getCloudinary } from "../config/cloudinary.config.js";

const SIGNED_URL_TTL_SECONDS = 5 * 60;

export async function uploadBufferToCloudinary(file, folder) {
    const cloudinary = getCloudinary();

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "auto",
                type: "private",
                use_filename: true,
                unique_filename: true,
                filename_override: file.originalname,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            }
        );

        stream.end(file.buffer);
    });
}

export async function destroyCloudinaryFile(publicId, resourceType = "image") {
    try {
        const cloudinary = getCloudinary();
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            type: "private",
            invalidate: true,
        });
    } catch (error) {
        console.error("Cloudinary cleanup failed:", error);
    }
}

export function getSignedAttachmentUrl(attachment) {
    const cloudinary = getCloudinary();
    const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
    let format = attachment.format;

    if (!format && attachment.originalName && attachment.originalName.includes(".")) {
        format = attachment.originalName.split(".").pop().toLowerCase();
    }

    const url = cloudinary.utils.private_download_url(attachment.cloudinaryPublicId, format, {
        resource_type: attachment.resourceType || "image",
        type: attachment.deliveryType || "private",
        expires_at: expiresAt,
        attachment: false,
    });

    return {
        url,
        expiresAt,
        expiresInSeconds: SIGNED_URL_TTL_SECONDS,
    };
}

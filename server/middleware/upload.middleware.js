import multer from "multer";
import path from "path";

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png"]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

export function getFileExtension(filename) {
    return path.extname(String(filename || "")).toLowerCase();
}

export function isAllowedUpload(file) {
    if (!file) {
        return false;
    }

    const extension = getFileExtension(file.originalname);
    const mimeType = String(file.mimetype || "").toLowerCase();

    return ALLOWED_MIME_TYPES.has(mimeType) && ALLOWED_EXTENSIONS.has(extension);
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        if (!isAllowedUpload(file)) {
            const error = new Error("Invalid file type. Allowed types: PDF, JPG, JPEG, PNG");
            error.statusCode = 400;
            error.code = "INVALID_FILE_TYPE";
            return callback(error);
        }

        callback(null, true);
    },
});

function pickUploadedFile(req) {
    if (req.file) {
        return req.file;
    }

    const files = req.files;

    if (Array.isArray(files) && files.length > 0) {
        return files[0];
    }

    if (files?.file?.[0]) {
        return files.file[0];
    }

    if (files?.attachment?.[0]) {
        return files.attachment[0];
    }

    return undefined;
}

export function handleUploadError(error, _req, res, next) {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File is too large. Maximum size is 2 MB" });
        }

        return res.status(400).json({ message: error.message || "File upload failed" });
    }

    if (error?.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({ message: error.message });
    }

    return next(error);
}

function runUpload(req, res, next) {
    upload.fields([
        { name: "file", maxCount: 1 },
        { name: "attachment", maxCount: 1 },
    ])(req, res, (error) => {
        if (error) {
            return handleUploadError(error, req, res, next);
        }

        req.file = pickUploadedFile(req);
        next();
    });
}

export function optionalTicketFile(req, res, next) {
    runUpload(req, res, next);
}

export function requireUploadedFile(req, res, next) {
    runUpload(req, res, (error) => {
        if (error) {
            return next(error);
        }

        if (!req.file) {
            return res.status(400).json({ message: "A file is required" });
        }

        if (req.file.size > MAX_FILE_SIZE_BYTES) {
            return res.status(400).json({ message: "File is too large. Maximum size is 2 MB" });
        }

        if (!isAllowedUpload(req.file)) {
            return res.status(400).json({
                message: "Invalid file type. Allowed types: PDF, JPG, JPEG, PNG",
            });
        }

        next();
    });
}

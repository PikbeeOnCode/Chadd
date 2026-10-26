import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { apiError } from "../utils/apiError.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/temp");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new apiError(400, "Only image and video files are allowed"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        files: 10,
        fileSize: 100 * 1024 * 1024, // 100MB per file
    },
});
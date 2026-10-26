import multer from "multer";
import { apiError } from "../utils/apiError.js";

export const errorHandler = (err, req, res, next) => {
    // multer errors (file too big, too many files, wrong field name)
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // your own apiError
    if (err instanceof apiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    // anything unexpected
    console.error(err);
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};
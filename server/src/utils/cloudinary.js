
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        return response;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        return null;
    } finally {
        // Remove the local temporary file after upload attempt.
        try {
            await fs.unlink(localFilePath);
        } catch (error) {
            if (error.code !== "ENOENT") {
                console.error("Temporary file cleanup failed:", error);
            }
        }
    }
};

// Delete by public ID and resource type.
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    if (!publicId) return null;

    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
    });

    if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(
            `Cloudinary deletion failed: ${result.result}`
        );
    }

    return result;
};

// Backward-compatible helpers that accept a Cloudinary URL.
const getPublicId = (url) => {
    if (!url) return null;

    try {
        const pathname = new URL(url).pathname;
        const uploadIndex = pathname.indexOf("/upload/");

        if (uploadIndex === -1) return null;

        let assetPath = pathname.slice(uploadIndex + "/upload/".length);

        // Remove version prefix, e.g. v123456/
        assetPath = assetPath.replace(/^v\d+\//, "");

        // Remove file extension
        return assetPath.replace(/\.[^/.]+$/, "");
    } catch {
        return null;
    }
};

const deleteImageFromCloudinary = async (url) => {
    const publicId = getPublicId(url);
    return deleteFromCloudinary(publicId, "image");
};

const deleteVideoFromCloudinary = async (url) => {
    const publicId = getPublicId(url);
    return deleteFromCloudinary(publicId, "video");
};

export {
    uploadOnCloudinary,
    deleteFromCloudinary,
    deleteImageFromCloudinary,
    deleteVideoFromCloudinary,
};

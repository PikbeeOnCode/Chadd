import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
    deleteImageFromCloudinary,
    deleteVideoFromCloudinary,
} from "../utils/cloudinary.js";
import db from "../db/db.js";
import { validate as isValidUUID } from "uuid";
import fs from "node:fs/promises";

/* ------------------------------ Helpers ------------------------------ */

const isValidId = (id) => typeof id === "string" && /^\d{1,18}$/.test(id);

const getPagination = (query) => {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
    return { page, limit, offset: (page - 1) * limit };
};

const attachMedia = async (posts) => {
    if (posts.length === 0) return posts;

    const { rows } = await db.query(
        `SELECT id, post_id, media_url, media_type, position
         FROM post_media
         WHERE post_id = ANY($1)
         ORDER BY post_id, position ASC`,
        [posts.map((p) => p.id)]
    );

    const mediaByPost = new Map();
    for (const media of rows) {
        if (!mediaByPost.has(media.post_id)) mediaByPost.set(media.post_id, []);
        mediaByPost.get(media.post_id).push(media);
    }

    return posts.map((p) => ({ ...p, media: mediaByPost.get(p.id) ?? [] }));
};

const fetchPostsPage = async (userId, query) => {
    const { page, limit, offset } = getPagination(query);

    const [postsResult, countResult] = await Promise.all([
        db.query(
            `SELECT p.id, p.user_id, p.content, p.post_type,
                    p.created_at, p.updated_at,
                    u.username, u.avatar_url
             FROM posts AS p
             JOIN users AS u ON u.id = p.user_id
             WHERE p.user_id = $1
             ORDER BY p.created_at DESC, p.id DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        ),
        db.query(`SELECT COUNT(*) FROM posts WHERE user_id = $1`, [userId]),
    ]);

    const posts = await attachMedia(postsResult.rows);
    const totalPosts = Number(countResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    return {
        posts,
        pagination: {
            currentPage: page,
            limit,
            totalPosts,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
};

// ignore errors: the Cloudinary util may already have removed the file
const removeTempFiles = (files) =>
    Promise.allSettled(files.map((file) => fs.unlink(file.path)));

/* ----------------------------- Controllers ----------------------------- */

const createPost = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { content } = req.body;
    const files = req.files ?? [];

    const uploadedMedia = [];
    let client;
    let committed = false;

    try {
        if (!userId) throw new apiError(401, "User is not authenticated");

        if (typeof content !== "string" || !content.trim()) {
            throw new apiError(400, "Caption is necessary");
        }

        if (files.length > 10) {
            throw new apiError(400, "Maximum 10 media files are allowed");
        }

        let postType = "text";

        if (files.length > 0) {
            const hasImage = files.some((f) => f.mimetype.startsWith("image/"));
            const hasVideo = files.some((f) => f.mimetype.startsWith("video/"));
            const hasUnsupported = files.some(
                (f) => !f.mimetype.startsWith("image/") && !f.mimetype.startsWith("video/")
            );

            if (hasUnsupported) throw new apiError(400, "Unsupported media type");

            if (hasImage && hasVideo) {
                throw new apiError(400, "Images and videos cannot be mixed in one post");
            }

            if (hasVideo && files.length > 1) {
                throw new apiError(400, "Only one video is allowed per post");
            }

            postType = hasVideo ? "video" : "image";
        }

        for (const [index, file] of files.entries()) {
            const result = await uploadOnCloudinary(file.path);

            if (
                !result?.secure_url ||
                !result?.public_id ||
                !["image", "video"].includes(result.resource_type)
            ) {
                throw new apiError(500, "Failed to upload media to Cloudinary");
            }

            uploadedMedia.push({
                media_url: result.secure_url,
                media_type: result.resource_type,
                public_id: result.public_id,
                position: index + 1,
            });
        }

        client = await db.connect();
        await client.query("BEGIN");

        const postResult = await client.query(
            `INSERT INTO posts (user_id, content, post_type)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [userId, content.trim(), postType]
        );

        const createdPost = postResult.rows[0];
        const savedMedia = [];

        for (const media of uploadedMedia) {
            const mediaResult = await client.query(
                `INSERT INTO post_media (post_id, media_url, media_type, public_id, position)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [createdPost.id, media.media_url, media.media_type, media.public_id, media.position]
            );
            savedMedia.push(mediaResult.rows[0]);
        }

        await client.query("COMMIT");
        committed = true;

        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: { post: createdPost, media: savedMedia },
        });
    } catch (error) {
        if (client && !committed) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Database rollback failed:", rollbackError);
            }
        }

        if (!committed) {
            const cleanupResults = await Promise.allSettled(
                uploadedMedia.map((m) => deleteFromCloudinary(m.public_id, m.media_type))
            );

            for (const result of cleanupResults) {
                if (result.status === "rejected") {
                    console.error("Cloudinary cleanup failed:", result.reason);
                }
            }
        }

        throw error;
    } finally {
        client?.release();
        await removeTempFiles(files);
    }
});

const updatePost = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) throw new apiError(401, "User is not authenticated");
    if (!isValidId(id)) throw new apiError(400, "Invalid post ID");

    if (typeof content !== "string" || !content.trim()) {
        throw new apiError(400, "Caption is required");
    }

    const result = await db.query(
        `UPDATE posts
         SET content = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [content.trim(), id, userId]
    );

    if (result.rowCount === 0) {
        throw new apiError(404, "Post not found or you are not allowed to update it");
    }

    return res.status(200).json({
        success: true,
        message: "Post updated successfully",
        data: { post: result.rows[0] },
    });
});

const deletePost = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    let client;
    let committed = false;
    let media = [];

    try {
        if (!userId) throw new apiError(401, "User is not authenticated");
        if (!isValidId(id)) throw new apiError(400, "Invalid post ID");

        client = await db.connect();
        await client.query("BEGIN");

        const postResult = await client.query(
            `SELECT id FROM posts
             WHERE id = $1 AND user_id = $2
             FOR UPDATE`,
            [id, userId]
        );

        if (postResult.rowCount === 0) {
            throw new apiError(404, "Post not found or you are not allowed to delete it");
        }

        const mediaResult = await client.query(
            `SELECT media_url, media_type, public_id
             FROM post_media
             WHERE post_id = $1`,
            [id]
        );

        media = mediaResult.rows;

        await client.query(`DELETE FROM posts WHERE id = $1 AND user_id = $2`, [id, userId]);

        await client.query("COMMIT");
        committed = true;
    } catch (error) {
        if (client && !committed) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Delete post rollback failed:", rollbackError);
            }
        }
        throw error;
    } finally {
        client?.release();
    }

    // Cloudinary cleanup only after DB commit
    const cleanupResults = await Promise.allSettled(
        media.map((item) => {
            if (item.public_id) {
                return deleteFromCloudinary(item.public_id, item.media_type);
            }
            // old rows without public_id -> fallback to URL based delete
            if (item.media_type === "video") return deleteVideoFromCloudinary(item.media_url);
            if (item.media_type === "image") return deleteImageFromCloudinary(item.media_url);
            return Promise.resolve();
        })
    );

    for (const result of cleanupResults) {
        if (result.status === "rejected") {
            console.error("Cloudinary media cleanup failed:", result.reason);
        }
    }

    return res.status(200).json({
        success: true,
        message: "Post deleted successfully",
    });
});

const getPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) throw new apiError(400, "Invalid post ID");

    const postResult = await db.query(
        `SELECT p.id, p.user_id, p.content, p.post_type,
                p.created_at, p.updated_at,
                u.username, u.avatar_url
         FROM posts AS p
         JOIN users AS u ON u.id = p.user_id
         WHERE p.id = $1`,
        [id]
    );

    if (postResult.rowCount === 0) throw new apiError(404, "Post not found");

    const [post] = await attachMedia(postResult.rows);

    return res.status(200).json({
        success: true,
        message: "Post fetched successfully",
        data: { post },
    });
});

const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !isValidUUID(userId)) throw new apiError(400, "Invalid user ID");

    const userResult = await db.query(`SELECT id FROM users WHERE id = $1`, [userId]);

    if (userResult.rowCount === 0) throw new apiError(404, "User not found");

    const { posts, pagination } = await fetchPostsPage(userId, req.query);

    return res.status(200).json({
        success: true,
        message: "User posts fetched successfully",
        data: { posts, pagination },
    });
});

const getMyPosts = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) throw new apiError(401, "User is not authenticated");

    const { posts, pagination } = await fetchPostsPage(userId, req.query);

    return res.status(200).json({
        success: true,
        message: "Your posts fetched successfully",
        data: { posts, pagination },
    });
});

export {
    createPost,
    updatePost,
    deletePost,
    getPostById,
    getUserPosts,
    getMyPosts,
};
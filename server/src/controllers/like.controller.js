
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import db from "../db/db.js";

import { isValidId } from "../utils/validation.js";

import {
    getPagination,
    buildPagination,
} from "../utils/pagination.js";

/* ------------------------------ Helpers ------------------------------ */

// Fixed table names and column names.
// Never take SQL table or column names from request input.
const TARGETS = {
    post: {
        table: "posts",
        likesTable: "post_likes",
        fkColumn: "post_id",
        paramName: "postId",
        idKey: "postId",
        label: "Post",
    },

    comment: {
        table: "comments",
        likesTable: "comment_likes",
        fkColumn: "comment_id",
        paramName: "commentId",
        idKey: "commentId",
        label: "Comment",
    },
};

// Validate authentication and the target ID.
const validateRequest = (userId, id, target) => {
    if (!userId) {
        throw new apiError(401, "User is not authenticated");
    }

    if (!isValidId(id)) {
        throw new apiError(
            400,
            `Invalid ${target.label.toLowerCase()} ID`
        );
    }
};

// Verify that the post or comment exists.
const assertExists = async (target, id) => {
    const result = await db.query(
        `SELECT id FROM ${target.table} WHERE id = $1`,
        [id]
    );

    if (result.rowCount === 0) {
        throw new apiError(404, `${target.label} not found`);
    }

    return result.rows[0];
};

// Count likes for a post or comment.
const getLikeCount = async (target, id) => {
    const result = await db.query(
        `SELECT COUNT(*)::int AS total
         FROM ${target.likesTable}
         WHERE ${target.fkColumn} = $1`,
        [id]
    );

    return result.rows[0].total;
};

// Attach media to posts returned in liked-post history.
// This follows the same approach used in postController.
const attachMedia = async (posts) => {
    if (posts.length === 0) {
        return posts;
    }

    const { rows } = await db.query(
        `SELECT id, post_id, media_url, media_type, position
         FROM post_media
         WHERE post_id = ANY($1)
         ORDER BY post_id, position ASC`,
        [posts.map((post) => post.id)]
    );

    const mediaByPost = new Map();

    for (const media of rows) {
        if (!mediaByPost.has(media.post_id)) {
            mediaByPost.set(media.post_id, []);
        }

        mediaByPost.get(media.post_id).push(media);
    }

    return posts.map((post) => ({
        ...post,
        media: mediaByPost.get(post.id) ?? [],
    }));
};


/* -------------------------- Shared Like Handlers -------------------------- */

// Add a like.
// The composite primary key prevents duplicate likes.

const addLike = (target) =>
    asyncHandler(async (req, res) => {
        const userId = req.user?.id;
        const id = req.params[target.paramName];

        validateRequest(userId, id, target);

        await assertExists(target, id);

        const insertResult = await db.query(
            `INSERT INTO ${target.likesTable}
                (user_id, ${target.fkColumn})
             VALUES ($1, $2)
             ON CONFLICT (user_id, ${target.fkColumn})
             DO NOTHING`,
            [userId, id]
        );

        // Useful when we add notifications later:
        // only a genuinely new like should trigger one.
        const newlyLiked = insertResult.rowCount === 1;

        const likeCount = await getLikeCount(target, id);

        const response = new apiResponse(
            200,
            {
                [target.idKey]: id,
                liked: true,
                likeCount,
                newlyLiked,
            },
            newlyLiked
                ? `${target.label} liked successfully`
                : `${target.label} already liked`
        );

        return res.status(response.statusCode).json(response);
    });


// Remove a like.
// Repeated unlike requests are safe.

const removeLike = (target) =>
    asyncHandler(async (req, res) => {
        const userId = req.user?.id;
        const id = req.params[target.paramName];

        validateRequest(userId, id, target);

        await assertExists(target, id);

        await db.query(
            `DELETE FROM ${target.likesTable}
             WHERE user_id = $1
               AND ${target.fkColumn} = $2`,
            [userId, id]
        );

        const likeCount = await getLikeCount(target, id);

        const response = new apiResponse(
            200,
            {
                [target.idKey]: id,
                liked: false,
                likeCount,
            },
            `${target.label} unliked successfully`
        );

        return res.status(response.statusCode).json(response);
    });


/* ------------------------------- Post Likes ------------------------------- */

// POST /posts/:postId/likes
export const likePost = addLike(TARGETS.post);

// DELETE /posts/:postId/likes
export const unlikePost = removeLike(TARGETS.post);


// GET /posts/:postId/likes?page=1&limit=10
// Fetch users who liked the post.

export const getPostLikes = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidId(postId)) {
        throw new apiError(400, "Invalid post ID");
    }

    await assertExists(TARGETS.post, postId);

    const { page, limit, offset } = getPagination(req.query);

    const [usersResult, total] = await Promise.all([
        db.query(
            `SELECT
                u.id,
                u.username,
                u.avatar_url,
                l.created_at AS liked_at
             FROM post_likes AS l
             JOIN users AS u ON u.id = l.user_id
             WHERE l.post_id = $1
             ORDER BY l.created_at DESC, u.id DESC
             LIMIT $2 OFFSET $3`,
            [postId, limit, offset]
        ),

        getLikeCount(TARGETS.post, postId),
    ]);

    const response = new apiResponse(
        200,
        {
            postId,
            users: usersResult.rows,
            pagination: buildPagination(
                page,
                limit,
                total,
                "totalLikes"
            ),
        },
        "Post likes fetched successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ---------------------------- Liked Post History ---------------------------- */

// GET /users/me/liked-posts?page=1&limit=10
// Fetch posts liked by the currently authenticated user.

export const getMyLikedPosts = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new apiError(401, "User is not authenticated");
    }

    const { page, limit, offset } = getPagination(req.query);

    const [postsResult, countResult] = await Promise.all([
        db.query(
            `SELECT
                p.id,
                p.user_id,
                p.content,
                p.post_type,
                p.created_at,
                p.updated_at,
                u.username,
                u.avatar_url,
                l.created_at AS liked_at,
                (
                    SELECT COUNT(*)::int
                    FROM post_likes AS pl
                    WHERE pl.post_id = p.id
                ) AS like_count,
                TRUE AS liked_by_me
             FROM post_likes AS l
             JOIN posts AS p ON p.id = l.post_id
             JOIN users AS u ON u.id = p.user_id
             WHERE l.user_id = $1
             ORDER BY l.created_at DESC, p.id DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        ),

        db.query(
            `SELECT COUNT(*)::int AS total
             FROM post_likes
             WHERE user_id = $1`,
            [userId]
        ),
    ]);

    const posts = await attachMedia(postsResult.rows);
    const total = countResult.rows[0].total;

    const response = new apiResponse(
        200,
        {
            posts,
            pagination: buildPagination(
                page,
                limit,
                total,
                "totalLikedPosts"
            ),
        },
        "Liked posts fetched successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------------ Comment Likes ------------------------------ */

// POST /comments/:commentId/likes
export const likeComment = addLike(TARGETS.comment);

// DELETE /comments/:commentId/likes
export const unlikeComment = removeLike(TARGETS.comment);

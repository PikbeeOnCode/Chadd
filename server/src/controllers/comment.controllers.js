
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import db from "../db/db.js";

import {
    isValidId,
    validateText,
} from "../utils/validation.js";

import {
    getPagination,
    buildPagination,
} from "../utils/pagination.js";

/* ------------------------------ Constants ------------------------------ */

const MAX_COMMENT_LENGTH = 100;


/* ------------------------- Create Comment ------------------------- */

// POST /posts/:postId/comments
// Body: { content, parentCommentId? }
//
// Without parentCommentId: create a top-level comment.
// With parentCommentId: create a reply under the original top-level comment.

const createComment = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!userId) {
        throw new apiError(401, "User is not authenticated");
    }

    if (!isValidId(postId)) {
        throw new apiError(400, "Invalid post ID");
    }

    const cleanContent = validateText(content, {
        fieldName: "Comment",
        maxLength: MAX_COMMENT_LENGTH,
    });

    // Verify that the post exists.
    const postResult = await db.query(
        `SELECT id
         FROM posts
         WHERE id = $1`,
        [postId]
    );

    if (postResult.rowCount === 0) {
        throw new apiError(404, "Post not found");
    }

    let parentId = null;

    // Handle replies using Instagram-style flat threading.
    if (parentCommentId !== undefined && parentCommentId !== null) {
        const rawParentId = String(parentCommentId);

        if (!isValidId(rawParentId)) {
            throw new apiError(400, "Invalid parent comment ID");
        }

        const parentResult = await db.query(
            `SELECT id, post_id, parent_comment_id
             FROM comments
             WHERE id = $1`,
            [rawParentId]
        );

        if (parentResult.rowCount === 0) {
            throw new apiError(404, "Parent comment not found");
        }

        const parent = parentResult.rows[0];

        // A reply must belong to the same post.
        if (BigInt(parent.post_id) !== BigInt(postId)) {
            throw new apiError(
                400,
                "Parent comment does not belong to this post"
            );
        }

        // If replying to another reply, store the new reply
        // under the original top-level comment.
        parentId = parent.parent_comment_id ?? parent.id;
    }

    const result = await db.query(
        `WITH inserted AS (
            INSERT INTO comments (
                user_id,
                post_id,
                parent_comment_id,
                content
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        )
        SELECT
            i.*,
            u.username,
            u.avatar_url
        FROM inserted AS i
        JOIN users AS u ON u.id = i.user_id`,
        [userId, postId, parentId, cleanContent]
    );

    const response = new apiResponse(
        201,
        { comment: result.rows[0] },
        parentId !== null
            ? "Reply added successfully"
            : "Comment added successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------- Get Post Comments ------------------------- */

// GET /posts/:postId/comments?page=1&limit=10
// Returns top-level comments, not their replies.

const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    if (!isValidId(postId)) {
        throw new apiError(400, "Invalid post ID");
    }

    const postResult = await db.query(
        `SELECT id
         FROM posts
         WHERE id = $1`,
        [postId]
    );

    if (postResult.rowCount === 0) {
        throw new apiError(404, "Post not found");
    }

    const { page, limit, offset } = getPagination(req.query);

    const [commentsResult, countResult] = await Promise.all([
        db.query(
            `SELECT
                c.id,
                c.user_id,
                c.post_id,
                c.content,
                c.created_at,
                c.updated_at,
                u.username,
                u.avatar_url,
                (
                    SELECT COUNT(*)::int
                    FROM comments AS r
                    WHERE r.parent_comment_id = c.id
                ) AS reply_count
             FROM comments AS c
             JOIN users AS u ON u.id = c.user_id
             WHERE c.post_id = $1
               AND c.parent_comment_id IS NULL
             ORDER BY c.created_at DESC, c.id DESC
             LIMIT $2 OFFSET $3`,
            [postId, limit, offset]
        ),

        db.query(
            `SELECT COUNT(*)::int AS total
             FROM comments
             WHERE post_id = $1
               AND parent_comment_id IS NULL`,
            [postId]
        ),
    ]);

    const total = countResult.rows[0].total;

    const response = new apiResponse(
        200,
        {
            comments: commentsResult.rows,
            pagination: buildPagination(
                page,
                limit,
                total,
                "totalComments"
            ),
        },
        "Comments fetched successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* --------------------------- Get Replies --------------------------- */

// GET /comments/:id/replies?page=1&limit=10
//
// Accepts a top-level comment ID.
// All replies are stored directly under that top-level comment.

const getReplies = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        throw new apiError(400, "Invalid comment ID");
    }

    // Only top-level comments own reply threads in our design.
    const parentResult = await db.query(
        `SELECT id
         FROM comments
         WHERE id = $1
           AND parent_comment_id IS NULL`,
        [id]
    );

    if (parentResult.rowCount === 0) {
        throw new apiError(404, "Top-level comment not found");
    }

    const { page, limit, offset } = getPagination(req.query);

    const [repliesResult, countResult] = await Promise.all([
        db.query(
            `SELECT
                c.id,
                c.user_id,
                c.post_id,
                c.parent_comment_id,
                c.content,
                c.created_at,
                c.updated_at,
                u.username,
                u.avatar_url
             FROM comments AS c
             JOIN users AS u ON u.id = c.user_id
             WHERE c.parent_comment_id = $1
             ORDER BY c.created_at ASC, c.id ASC
             LIMIT $2 OFFSET $3`,
            [id, limit, offset]
        ),

        db.query(
            `SELECT COUNT(*)::int AS total
             FROM comments
             WHERE parent_comment_id = $1`,
            [id]
        ),
    ]);

    const total = countResult.rows[0].total;

    const response = new apiResponse(
        200,
        {
            replies: repliesResult.rows,
            pagination: buildPagination(
                page,
                limit,
                total,
                "totalReplies"
            ),
        },
        "Replies fetched successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------- Update Comment ------------------------- */

// PATCH /comments/:id
// Body: { content }
// Only the comment's author can update it.

const updateComment = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) {
        throw new apiError(401, "User is not authenticated");
    }

    if (!isValidId(id)) {
        throw new apiError(400, "Invalid comment ID");
    }

    const cleanContent = validateText(content, {
        fieldName: "Comment",
        maxLength: MAX_COMMENT_LENGTH,
    });

    const result = await db.query(
        `UPDATE comments
         SET content = $1,
             updated_at = NOW()
         WHERE id = $2
           AND user_id = $3
         RETURNING *`,
        [cleanContent, id, userId]
    );

    if (result.rowCount === 0) {
        throw new apiError(
            404,
            "Comment not found or you are not allowed to update it"
        );
    }

    const response = new apiResponse(
        200,
        { comment: result.rows[0] },
        "Comment updated successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------- Delete Comment ------------------------- */

// DELETE /comments/:id
//
// Allowed:
// 1. The comment's author.
// 2. The owner of the post.
//
// PostgreSQL ON DELETE CASCADE deletes replies automatically.

const deleteComment = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
        throw new apiError(401, "User is not authenticated");
    }

    if (!isValidId(id)) {
        throw new apiError(400, "Invalid comment ID");
    }

    const result = await db.query(
        `DELETE FROM comments AS c
         USING posts AS p
         WHERE c.id = $1
           AND p.id = c.post_id
           AND (
               c.user_id = $2
               OR p.user_id = $2
           )
         RETURNING c.id`,
        [id, userId]
    );

    if (result.rowCount === 0) {
        throw new apiError(
            404,
            "Comment not found or you are not allowed to delete it"
        );
    }

    const response = new apiResponse(
        200,
        {},
        "Comment deleted successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------------ Exports ------------------------------ */

export {
    createComment,
    getPostComments,
    getReplies,
    updateComment,
    deleteComment,
};

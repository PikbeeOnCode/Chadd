
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { validate as isValidUUID } from "uuid";
import db from "../db/db.js";

import {
    getPagination,
    buildPagination,
} from "../utils/pagination.js";

/* ------------------------------ Helpers ------------------------------ */

// Validate UUIDs because users.id is a UUID.
const validateUserId = (userId) => {
    if (typeof userId !== "string" || !isValidUUID(userId)) {
        throw new apiError(400, "Invalid user ID");
    }
};

// Ensure authentication for protected operations.
const validateAuthenticatedUser = (userId) => {
    if (!userId) {
        throw new apiError(401, "User is not authenticated");
    }
};

// Check whether a target user exists.
const assertUserExists = async (userId) => {
    const result = await db.query(
        `SELECT id
         FROM users
         WHERE id = $1`,
        [userId]
    );

    if (result.rowCount === 0) {
        throw new apiError(404, "User not found");
    }

    return result.rows[0];
};

// Resolve the user whose followers/following/counts we want.
//
// /users/me/followers       -> req.user.id
// /users/me/following       -> req.user.id
// /users/me/follow-counts   -> req.user.id
// /users/:userId/...        -> req.params.userId

const getTargetUserId = (req) => {
    const userId = req.params.userId ?? req.user?.id;

    if (!userId) {
        throw new apiError(401, "User is not authenticated");
    }

    validateUserId(userId);

    return userId;
};


/* ------------------------------ Follow User ------------------------------ */

// POST /users/:userId/follow
// Follow another user.

const followUser = asyncHandler(async (req, res) => {
    const followerId = req.user?.id;
    const { userId: followingId } = req.params;

    validateAuthenticatedUser(followerId);
    validateUserId(followerId);
    validateUserId(followingId);

    if (followerId.toLowerCase() === followingId.toLowerCase()) {
        throw new apiError(400, "You cannot follow yourself");
    }

    const targetUser = await assertUserExists(followingId);

    let result;

    try {
        result = await db.query(
            `INSERT INTO follows (follower_id, following_id)
             VALUES ($1, $2)
             ON CONFLICT (follower_id, following_id)
             DO NOTHING
             RETURNING following_id`,
            [followerId, targetUser.id]
        );
    } catch (error) {
        // Handle a user being deleted while the follow is being created.
        if (error.code === "23503") {
            throw new apiError(404, "User no longer exists");
        }

        throw error;
    }

    const newlyFollowed = result.rowCount === 1;

    const response = new apiResponse(
        newlyFollowed ? 201 : 200,
        {
            userId: targetUser.id,
            isFollowing: true,
            newlyFollowed,
        },
        newlyFollowed
            ? "User followed successfully"
            : "You are already following this user"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------------ Unfollow User ------------------------------ */

// DELETE /users/:userId/follow
// Unfollow a user.

const unfollowUser = asyncHandler(async (req, res) => {
    const followerId = req.user?.id;
    const { userId: followingId } = req.params;

    validateAuthenticatedUser(followerId);
    validateUserId(followerId);
    validateUserId(followingId);

    if (followerId.toLowerCase() === followingId.toLowerCase()) {
        throw new apiError(400, "You cannot unfollow yourself");
    }

    const targetUser = await assertUserExists(followingId);

    const result = await db.query(
        `DELETE FROM follows
         WHERE follower_id = $1
           AND following_id = $2`,
        [followerId, targetUser.id]
    );

    const wasFollowing = result.rowCount === 1;

    const response = new apiResponse(
        200,
        {
            userId: targetUser.id,
            isFollowing: false,
            wasFollowing,
        },
        wasFollowing
            ? "User unfollowed successfully"
            : "You were not following this user"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------------ Get Followers ------------------------------ */

// GET /users/:userId/followers?page=1&limit=10
// GET /users/me/followers?page=1&limit=10
//
// Includes isFollowing for each listed follower, allowing the frontend
// to decide whether to display Follow or Following.
//
// Public profile routes should use optional authentication so req.user
// is populated when a valid token is supplied, but guests are still allowed.

const getFollowers = asyncHandler(async (req, res) => {
    const userId = getTargetUserId(req);
    const targetUser = await assertUserExists(userId);

    const { page, limit, offset } = getPagination(req.query);

    // If the viewer is a guest, viewerId is null and isFollowing
    // will be false for every returned user.
    const viewerId = req.user?.id ?? null;

    const [followersResult, countResult] = await Promise.all([
        db.query(
            `SELECT
                u.id,
                u.username,
                u.avatar_url,
                f.created_at AS followed_at,
                (
                    $4::uuid IS NOT NULL
                    AND EXISTS (
                        SELECT 1
                        FROM follows AS viewer_follow
                        WHERE viewer_follow.follower_id = $4
                          AND viewer_follow.following_id = u.id
                    )
                ) AS is_following
             FROM follows AS f
             JOIN users AS u ON u.id = f.follower_id
             WHERE f.following_id = $1
             ORDER BY f.created_at DESC, u.id ASC
             LIMIT $2 OFFSET $3`,
            [targetUser.id, limit, offset, viewerId]
        ),

        db.query(
            `SELECT COUNT(*)::int AS total
             FROM follows
             WHERE following_id = $1`,
            [targetUser.id]
        ),
    ]);

    const total = countResult.rows[0].total;

    const response = new apiResponse(
        200,
        {
            userId: targetUser.id,
            followers: followersResult.rows,
            pagination: buildPagination(
                page,
                limit,
                total,
                "totalFollowers"
            ),
        },
        "Followers fetched successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------------ Get Following ------------------------------ */

// GET /users/:userId/following?page=1&limit=10
// GET /users/me/following?page=1&limit=10

const getFollowing = asyncHandler(async (req, res) => {
    const userId = getTargetUserId(req);
    const targetUser = await assertUserExists(userId);

    const { page, limit, offset } = getPagination(req.query);

    const [followingResult, countResult] = await Promise.all([
        db.query(
            `SELECT
                u.id,
                u.username,
                u.avatar_url,
                f.created_at AS followed_at
             FROM follows AS f
             JOIN users AS u ON u.id = f.following_id
             WHERE f.follower_id = $1
             ORDER BY f.created_at DESC, u.id ASC
             LIMIT $2 OFFSET $3`,
            [targetUser.id, limit, offset]
        ),

        db.query(
            `SELECT COUNT(*)::int AS total
             FROM follows
             WHERE follower_id = $1`,
            [targetUser.id]
        ),
    ]);

    const total = countResult.rows[0].total;

    const response = new apiResponse(
        200,
        {
            userId: targetUser.id,
            following: followingResult.rows,
            pagination: buildPagination(
                page,
                limit,
                total,
                "totalFollowing"
            ),
        },
        "Following list fetched successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------------ Follow Status ------------------------------ */

// GET /users/:userId/follow-status
// Check whether the logged-in user follows the target user.

const getFollowStatus = asyncHandler(async (req, res) => {
    const followerId = req.user?.id;
    const { userId: followingId } = req.params;

    validateAuthenticatedUser(followerId);
    validateUserId(followerId);
    validateUserId(followingId);

    const targetUser = await assertUserExists(followingId);

    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1
            FROM follows
            WHERE follower_id = $1
              AND following_id = $2
        ) AS is_following`,
        [followerId, targetUser.id]
    );

    const response = new apiResponse(
        200,
        {
            userId: targetUser.id,
            isFollowing: result.rows[0].is_following,
        },
        "Follow status fetched successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------------ Follow Counts ------------------------------ */

// GET /users/:userId/follow-counts
// GET /users/me/follow-counts

const getFollowCounts = asyncHandler(async (req, res) => {
    const userId = getTargetUserId(req);
    const targetUser = await assertUserExists(userId);

    const result = await db.query(
        `SELECT
            (
                SELECT COUNT(*)::int
                FROM follows
                WHERE following_id = $1
            ) AS follower_count,
            (
                SELECT COUNT(*)::int
                FROM follows
                WHERE follower_id = $1
            ) AS following_count`,
        [targetUser.id]
    );

    const response = new apiResponse(
        200,
        {
            userId: targetUser.id,
            followerCount: result.rows[0].follower_count,
            followingCount: result.rows[0].following_count,
        },
        "Follow counts fetched successfully"
    );

    return res.status(response.statusCode).json(response);
});


/* ------------------------------ Exports ------------------------------ */

export {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus,
    getFollowCounts,
};

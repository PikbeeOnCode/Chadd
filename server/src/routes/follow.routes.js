
import { Router } from "express";

import { verifyJwt } from "../middlewares/authMiddleware.middleware.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";

import {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStatus,
    getFollowCounts,
} from "../controllers/follow.controller.js";

const router = Router();

/* ------------------------- My Own Follow Lists ------------------------- */

// These routes MUST come before /:userId routes.
router.get("/me/followers", verifyJwt, getFollowers);
router.get("/me/following", verifyJwt, getFollowing);
router.get("/me/follow-counts", verifyJwt, getFollowCounts);

/* ------------------------- Other Users' Lists ------------------------- */

// Public profile lists.
router.get("/:userId/followers", optionalAuth, getFollowers);
router.get("/:userId/following", optionalAuth, getFollowing);
router.get("/:userId/follow-counts",optionalAuth, getFollowCounts);


/* ------------------------- Follow Status ------------------------- */

// Check whether the logged-in user follows this user.
router.get("/:userId/follow-status", verifyJwt, getFollowStatus);


/* ------------------------- Follow / Unfollow ------------------------- */

router.post("/:userId/follow", verifyJwt, followUser);
router.delete("/:userId/follow", verifyJwt, unfollowUser);

export default router;

import { Router,} from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/authMiddleware.middleware.js";

import {
    createPost,
    updatePost,
    deletePost,
    getPostById,
    getUserPosts,
    getMyPosts
} from "../controllers/post.controllers.js"

import {
    createComment,
    getPostComments
} from "../controllers/comment.controllers.js"


import {
    likePost,
    unlikePost,
    getPostLikes,
    getMyLikedPosts,
} from "../controllers/like.controller.js";

const router = Router();

router.post(
    "/",
    verifyJwt,
    upload.array("media", 10),
    createPost
);

router.patch(
    "/:id",
     verifyJwt,
    updatePost
);

router.delete(
    "/:id", 
    verifyJwt,
     deletePost
    );

router.get(
    "/my-posts",
     verifyJwt,
     getMyPosts);

 router.get(
    "/:id"
    , getPostById
    );

router.get(
     "/user/:userId",
        getUserPosts
    );

// comment route

    // Create a comment or reply
router.post(
    "/:postId/comments",
     verifyJwt,
      createComment
    );

// Fetch comments belonging to a post
router.get(
    "/:postId/comments", 
    getPostComments
);

router.get("/liked/me", verifyJwt, getMyLikedPosts);
router.get("/:postId/likes", getPostLikes);
router.post("/:postId/likes", verifyJwt, likePost);
router.delete("/:postId/likes", verifyJwt, unlikePost);


export default router
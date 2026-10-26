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


export default router
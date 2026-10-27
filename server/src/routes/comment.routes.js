
import { Router } from "express";

import {
  
    getReplies,
    updateComment,
    deleteComment,
} from "../controllers/comment.controllers.js";

import {
    likeComment,
    unlikeComment,
} from "../controllers/like.controller.js";




import { verifyJwt } from "../middlewares/authMiddleware.middleware.js";

const router = Router();

/* ------------------------- Post Comments ------------------------- */


/* ----------------------------- Replies ----------------------------- */

// Fetch replies under a top-level comment (public)
router.get("/:id/replies", getReplies);


/* ------------------------- Update / Delete ------------------------- */

// Update your own comment (login required)
router.patch("/:id", verifyJwt, updateComment);

// Delete your own comment or a comment on your post (login required)
router.delete("/:id", verifyJwt, deleteComment);


router.post("/:commentId/likes", verifyJwt, likeComment);
router.delete("/:commentId/likes", verifyJwt, unlikeComment);



export default router;

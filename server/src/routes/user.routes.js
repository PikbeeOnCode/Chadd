import { Router,} from "express";
import { verifyJwt } from "../middlewares/authMiddleware.middleware.js";

import { registerUser, verifyEmail } from "../controllers/user.controllers.js";
const router = Router() ; 


router.post("/register",registerUser);
router.get("/verify-email",verifyEmail);



export default router ;  
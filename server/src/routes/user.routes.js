import { Router,} from "express";
import { verifyJwt } from "../middlewares/authMiddleware.middleware.js";

import { registerUser } from "../controllers/user.controllers.js";
const router = Router() ; 


router.post("/register",registerUser)



export default router ; 
import { Router,} from "express";
import passport from "passport";

import { verifyJwt } from "../middlewares/authMiddleware.middleware.js";

import { 
    loginUser,
     registerUser,
      verifyEmail,
      googleCallBack,
      refreshTokenUser,
      logoutUser
     }
 from "../controllers/user.controllers.js";
const router = Router() ; 


router.post(
    "/auth/register"
    ,registerUser
);

router.get(
    "/auth/verify-email",
    verifyEmail
);


router.post(
    "/auth/login"
    ,loginUser
);

router.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    googleCallBack
);

router.post("/refresh-token", refreshTokenUser);

router.post(
    "/auth/logout",
    verifyJwt,
    logoutUser
);




export default router ;  
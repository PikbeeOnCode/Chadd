import { Router,} from "express";
import passport from "passport";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/authMiddleware.middleware.js";

import { 
    loginUser,
     registerUser,
      verifyEmail,
      googleCallBack,
      refreshTokenUser,
      logoutUser,
      updateProfile
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


router.patch(
    "/profile",
    verifyJwt,
    upload.single("avatar"),
    updateProfile
);





export default router ;  

import jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";

const optionalAuth = (req, res, next) => {
    // Read the access token using the same sources as verifyJwt.
    const token =
        req.cookies?.accessToken ||
        req.headers?.authorization?.replace(/^Bearer\s+/i, "");

    // No token means the visitor can continue as a guest.
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        // Our controllers expect req.user.id.
        if (!decoded.id) {
            return next(
                new apiError(401, "Invalid access token payload")
            );
        }

        // A valid token identifies the authenticated user.
        req.user = decoded;

        return next();
    } catch (error) {
        // An expired access token should trigger the frontend's
        // refresh-token flow instead of silently becoming a guest.
        if (error.name === "TokenExpiredError") {
            return next(
                new apiError(401, "Access token expired")
            );
        }

        // Other invalid tokens are treated as guest requests
        // on public endpoints.
        req.user = undefined;

        return next();
    }
};

export { optionalAuth };

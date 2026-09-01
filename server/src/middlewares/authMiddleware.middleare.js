import { apiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";

const verifyJwt = async (req, res, next) => {
  try {
    // get token from header
    const token =  req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw new apiError(401, "Token not available");
    }

    // verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // just set decoded user directly — no DB call needed!
    req.user = decoded;
    
    next();

  } catch (error) {
    next(new apiError(401, error.message || "Unauthorized access"))
  }
}

export { verifyJwt }
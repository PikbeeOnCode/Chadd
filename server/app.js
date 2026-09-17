import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
import session from "express-session";
import passport from "./src/config/passport.config.js"; // adjust path to match your actual file location
import userRoutes from "./src/routes/user.routes.js"
 
const app = express();
 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // needed since you're reading req.cookies elsewhere (verifyJwt, login, etc.)
 
// session must come BEFORE passport
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
 
app.use(passport.initialize());
app.use(passport.session());
 
app.use("/api/v1/users", userRoutes);
 
export { app };
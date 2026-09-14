import db from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import crypto from "crypto"
import sendVerificationEmail from "../utils/email.js";
import { verifyJwt } from "../middlewares/authMiddleware.middleware.js";

const saltRounds = 10;
 const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
}


const generateToken = async(userId)=>{
    try{
        const user = await db.query("select * from users where id = $1",[userId]);
        if(user.rows.length === 0){
            throw new apiError(404,"User not found");
        }

        const payload = {id: user.rows[0].id,email: user.rows[0].email};

        const accessToken = jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET,{expiresIn: process.env.ACCESS_TOKEN_EXPIRY});
        const refreshToken = jwt.sign(payload,process.env.REFRESH_TOKEN_SECRET,{expiresIn: process.env.REFRESH_TOKEN_EXPIRY});
        return { accessToken, refreshToken };
    }catch(error){
        throw new apiError(500,"Failed to generate token");
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const {username,email,password,gender} = req.body;
  

    if([username,email,password].some(field=>field?.trim()==="")){
       throw new apiError(400,"All fields are required");
   }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!passwordRegex.test(password)) {
    throw new apiError(422, "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character");
    }

//   validatingg emailll domains 
   const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (!allowedDomains.includes(emailDomain)) {
    throw new apiError(400, "Please register with a Gmail, Yahoo, or Outlook email");
    }

   const existingUser = await db.query("select * from users where email = $1",[email]);

   if(existingUser.rows.length > 0){
    throw new apiError(400,"User with this email already exists");
   }

//     hasing  user password 

   const hashedPassword = await bcrypt.hash(password,saltRounds);

  
   const newUser = await db.query("insert into users (username,email,hash_password,gender) values($1,$2,$3,$4) returning *",[username,email,hashedPassword,gender])

   if(!newUser.rows[0]){
    throw new apiError(500,"Failed to create user");
   }

   const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

   const insertVerificationToken = await db.query(` update users set verification_token = $1 , verification_token_expires_at = $2 where id = $3  returning * `,[
    verificationToken,
    verificationExpiresAt,
    newUser.rows[0].id
   ])

   if(!insertVerificationToken.rows[0]){
    throw new apiError(500,"Failed to save verification token");
}

   

    try {
    await sendVerificationEmail(newUser.rows[0].email, verificationToken);
    } catch (err) {
    console.error("Failed to send verification email:", err);
    // continue anyway — don't throw
    }


    const {accessToken, refreshToken} = await generateToken(newUser.rows[0]?.id);

   if(!accessToken || !refreshToken){
    throw new apiError(500,"Failed to generate tokens");
   }

    const hashToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

   const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

   

   const insertToken = await db.query(`insert into refresh_tokens (user_id,token_hash,expires_at,revoked_at)  VALUES ($1, $2, $3, $4)
   RETURNING *`,[
    newUser.rows[0].id,
    hashToken,
    expiresAt,
    null
]);

   if(!insertToken.rows[0]){
    throw new apiError(500,"Failed to store refresh token");
   }

  

   res.status(201)
   .cookie("refreshToken", refreshToken, options)
   .cookie("accessToken", accessToken, options)
   .json(
    new apiResponse(
        201,
       {
        user:{
            id: newUser.rows[0].id,
            username: newUser.rows[0].username,
            email: newUser.rows[0].email,
            emailVerfied:newUser.rows[0].email_verified,
         },
         accessToken,
         refreshToken
       }
       , "User registered successfully")
   )
});

export {
    registerUser
}
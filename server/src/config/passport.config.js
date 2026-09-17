import passport from "passport";
import {Strategy as googleStrategy} from "passport-google-oauth20";
import db from "../db/db.js"


passport.use(
    new googleStrategy(
        {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
         callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async(accessToken,refreshToken,Profile,done)=>{
            try{
                const existingProvider = await db.query(`select * from auth_providers where provider = 'google' and provider_user_id = $1 `,[
                    Profile.id
                ]);

                if(existingProvider.rows.length > 0){ 
                      const userResult = await db.query("select * from users where id = $1", [existingProvider.rows[0].user_id]);
                        return done(null, userResult.rows[0]);
                }else{
                 const existingEmailUser = await db.query("select * from users where email = $1", [Profile.emails[0].value]);
                        if(existingEmailUser.rows.length > 0 ){
                            const insertingProvider = await db.query(`
                                insert into auth_providers (user_id,provider,provider_user_id)
                                values ($1,$2,$3)
                                `,[
                                    existingEmailUser.rows[0].id,
                                    'google',
                                    Profile.id
                                ])
                            return done(null,existingEmailUser.rows[0]);
                        }else{
                            const email = Profile.emails[0].value;
                            const usernameBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''); 
                            const generatedUsername = usernameBase + Math.floor(Math.random() * 10000);


                            const newUser =  await db.query(`
                                insert into users (username,email,hash_password,avatar_url,email_verified)  
                                values ($1,$2,$3,$4,$5)
                                returning *
                                `,[
                                    generatedUsername,
                                    Profile.emails[0].value,
                                    null,
                                    Profile.photos[0].value,
                                    true
                                ]);

                                const insertingProvider = await db.query(`
                                insert into auth_providers (user_id,provider,provider_user_id)
                                values ($1,$2,$3)
                                `,[
                                    newUser.rows[0].id,
                                    'google',
                                    Profile.id
                                ])
                            return done(null,newUser.rows[0]);

                        }
                }
            }catch(error){
                done(error,null)
            }
        }
    )
)

export default passport;
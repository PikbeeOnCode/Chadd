import pg from "pg";
import  dotenv from "dotenv"



// const db = new pg.Client({
//   connectionString: process.env.PG_DATABASE,
//   ssl: process.env.NODE_ENV === "production" 
//     ? { rejectUnauthorized: false } 
//     : false  // ← no SSL for local!
// });

dotenv.config();



const db = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

export const connectDB = async () => {
  await db.connect();
  console.log("Postgres connected!");
};



export default db;
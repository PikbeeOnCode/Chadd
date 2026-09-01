import dotenv from "dotenv";
import { connectDB } from "./src/db/db.js";
import { app }  from "./app.js";

dotenv.config();

connectDB()
.then(() => {
    app.on("error", (err) => {
        console.error("Server error:", err);
        throw err;        
    });

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT} !!!`);
    }
)})
.catch((err) => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
})
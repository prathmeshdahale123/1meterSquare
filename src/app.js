const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database")

app.use(express.json());
app.use(cookieParser());




connectDB()
.then(() => {
    console.log("database connected succesfully...");
    app.listen(7777, () => {
        console.log("Server is listening on port 7777");
    })
    
}).catch(() => {
    console.log("database connection failed!!!");
    
} )

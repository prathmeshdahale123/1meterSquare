const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database")
const { propertyRouter } = require("./router/propertyRouter")
const { authRouter } = require("./router/authRouter")
const { favoriteRouter } = require("./router/favoriteRouter")
const { profileRouter } = require("./router/profileRouter")
require("dotenv").config();

app.use(express.json());
app.use(cookieParser());

app.use("/", propertyRouter)
app.use("/", authRouter)
app.use("/", favoriteRouter)
app.use("/", profileRouter)





connectDB()
.then(() => {
    console.log("database connected succesfully...");
    app.listen(3333, () => {
        console.log("Server is listening on port 3333");
    })
    
}).catch(() => {
    console.log("database connection failed!!!");
    
} )

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/database")
const { propertyRouter } = require("./router/propertyRouter")
const { authRouter } = require("./router/authRouter")
const { favoriteRouter } = require("./router/favoriteRouter")
const { profileRouter } = require("./router/profileRouter")
require("dotenv").config();
const cors = require("cors");

app.use(express.json());
app.use(cookieParser());

app.use("/", propertyRouter)
app.use("/", authRouter)
app.use("/", favoriteRouter)
app.use("/", profileRouter)

const allowedOrigins = [
    "http://localhost:5173"              
];
  
  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  }));
  



connectDB()
.then(() => {
    console.log("database connected succesfully...");
    app.listen(process.env.PORT, () => {
        console.log("Server is listening on port");
    })
    
}).catch(() => {
    console.log("database connection failed!!!");
    
} )

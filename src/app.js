const express = require("express");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
const rateLimit = require('express-rate-limit');
const { connectDB } = require("./config/database")
const { propertyRouter } = require("./router/propertyRouter")
const { authRouter } = require("./router/authRouter")
const { favoriteRouter } = require("./router/favoriteRouter")
const { profileRouter } = require("./router/profileRouter")
const cors = require("cors");

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://dream-market-psi.vercel.app/",
    "http://localhost:8080"     
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

app.use(express.json());
app.use(cookieParser());

// --- Rate Limiting Middleware Configuration ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

//health check route
app.get('/health', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Backend is running',
      });
    });


app.use("/", authLimiter, authRouter)
app.use("/", apiLimiter, propertyRouter)
app.use("/", apiLimiter, favoriteRouter)
app.use("/", apiLimiter, profileRouter)


  



connectDB()
.then(() => {
    console.log("database connected succesfully...");
    app.listen(process.env.PORT, () => {
        console.log("Server is listening on port");
    })
    
}).catch(() => {
    console.log("database connection failed!!!");
    
} )

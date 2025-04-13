const express = require("express");
const authRouter = express.Router();
const { User } = require("../models/User"); 
const validator = require("validator");
const { auth } = require("../middleware/auth");
const bcrypt = require("bcrypt");

// Register new user
authRouter.post("/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password, role, contactNumber } = req.body;

      if (!firstName || !lastName || !email || !password || !role) {
        throw new Error("All fields are required");
      }
  
      if (!validator.isEmail(email)) {
        throw new Error("Invalid email format");
      }
      const allowedRoles = ["buyer", "seller"];
        if (!allowedRoles.includes(role)) {
            throw new Error("Invalid role. Allowed roles are: buyer, seller");
     }
  
      const existing = await User.findOne({ email });
      if (existing) throw new Error("Email already registered");

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({ firstName, lastName, email, password: hashedPassword, role, contactNumber });
      await user.save();
  
      const token = await user.setJWT();
      res.cookie("Token", token, { httpOnly: true });
  
      res.status(201).send("User registered successfully");
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  });

// login API
  authRouter.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!validator.isEmail(email)) {
        throw new Error("Invalid email format");
      }
  
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");
      
  
      const isPassValid = await user.validatePassword(password);
      if (!isPassValid) throw new Error("Invalid password");
  
      const token = await user.setJWT();
      res.cookie("Token", token, { httpOnly: true });
  
      res.send("Login successful");
    } catch (error) {
      res.status(400).send("ERROR: " + error.message);
    }
  });

  
// logout API
  authRouter.post("/logout", (req, res) => {
    res.clearCookie("Token");
    res.send("Logged out successfully");
  });

// Get Current User
  authRouter.get("/me", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("-password");
      if (!user) throw new Error("User not found");
  
      res.send(user);
    } catch (err) {
      res.status(400).send("ERROR: " + err.message);
    }
  });
  
  
  module.exports = { 
    authRouter
  }
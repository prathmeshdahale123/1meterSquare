const express = require("express");
const authRouter = express.Router();
const { User } = require("../models/user"); 
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

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ ERROR: err.message });
  }
});

// Login API
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

    res.status(200).json({ msg: "Login successful" });
  } catch (error) {
    res.status(400).json({ ERROR: error.message });
  }
});

// Logout API
authRouter.post("/logout", (req, res) => {
  res.clearCookie("Token");
  res.status(200).json({ msg: "Logged out successfully" });
});

module.exports = { authRouter };

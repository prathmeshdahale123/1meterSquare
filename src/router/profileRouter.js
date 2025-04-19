const express = require("express");
const profileRouter = express.Router();
const { User } = require("../models/user");
const { auth } = require("../middleware/auth");
const bcrypt = require("bcrypt");

// Get current user's profile
profileRouter.get("/profile/view", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) throw new Error("User not found");

    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// Update name and contact number
profileRouter.put("/profile/update", auth, async (req, res) => {
  try {
    const { firstName, lastName, contactNumber } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) throw new Error("User not found");

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (contactNumber) user.contactNumber = contactNumber;

    await user.save();
    res.send("Profile updated successfully");
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// Change password
profileRouter.put("/profile/update/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Incorrect current password");

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.send("Password updated successfully");
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = { profileRouter };

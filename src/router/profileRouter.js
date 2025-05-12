const express = require("express");
const profileRouter = express.Router();
const { User } = require("../models/user");
const { auth } = require("../middleware/auth");
const bcrypt = require("bcrypt");
const { OTP } = require("../models/otp");
const { sendEmail } = require("../utils/sendEmail");

// Get current user's profile
profileRouter.get("/profile/view", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) throw new Error("User not found");

    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ ERROR: err.message });
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
    res.status(200).json({ msg: "Profile updated successfully" });
  } catch (err) {
    res.status(400).json({ ERROR: err.message });
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

    res.status(200).json({ msg: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ ERROR: err.message });
  }
});

// Send otp route
profileRouter.post("/profile/request-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.deleteMany({ email }); // Remove previous OTPs

    const newOTP = new OTP({ email, code: otpCode, expiresAt });
    await newOTP.save();

    await sendEmail(email, "Password Reset OTP", `Your OTP is: ${otpCode}`);

    res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Confirm otp + reset password route
profileRouter.post("/profile/confirm-reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const existingOTP = await OTP.findOne({ email, code: otp });
    if (!existingOTP || existingOTP.expiresAt < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    await OTP.deleteMany({ email }); // Clear OTPs after use

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = { profileRouter };

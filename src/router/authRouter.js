const express = require("express");
const crypto = require("crypto");
const authRouter = express.Router();
const { User } = require("../models/user"); 
const { auth } = require("../middleware/auth");
const {sendEmail} = require("../utils/email");

// --- 1. REGISTER A NEW USER (UPDATED with Intent Logic) ---
authRouter.post("/register", async (req, res) => {
  try {
    // 1. Destructure `sellerType` from the request body
    const { firstName, lastName, email, password, confirmPassword, contactNumber, intent, sellerType } = req.body;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    let userRole = 'buyer';
    if (intent === 'sell') {
        userRole = 'seller';
        // 2. If intent is to sell, the sellerType is now mandatory
        if (!sellerType || !['Owner', 'Agent', 'Builder'].includes(sellerType)) {
            return res.status(400).json({ success: false, message: "A valid seller type (Owner, Agent, or Builder) is required to register as a seller." });
        }
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    // 3. Create the user with the role and sellerType
    const user = new User({ 
        firstName, lastName, email, password, contactNumber,
        role: userRole,
        sellerType: userRole === 'seller' ? sellerType : undefined // Only set sellerType if the role is seller
    });
    
    user.confirmPassword = confirmPassword;

    const otp = user.generateEmailVerificationToken();
    await user.save(); // Mongoose will now validate the conditional 'sellerType' requirement
    
    // ... (send email and response logic)
    const message = `Welcome! Your verification OTP is: ${otp}\nIt will expire in 10 minutes.`;
    await sendEmail({ email: user.email, subject: 'Email Verification OTP', message });
    res.status(201).json({ success: true, message: `User registered. An OTP has been sent to ${user.email} for verification.` });

  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to register user.", error: error.message });
  }
});


// --- 2. VERIFY EMAIL & LOGIN (This route is updated) ---
authRouter.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Please provide email and OTP." });
        }
        const user = await User.findOne({ 
            email, 
            emailVerificationToken: otp,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid OTP or OTP has expired." });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        const token = user.generateAuthToken();
        res.cookie("token", token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", 
            sameSite: "strict" 
        });

        res.status(200).json({ 
            success: true, 
            message: "Email verified and user logged in successfully.",
            data: user, // The toJSON method will sanitize this
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "An internal server error occurred.", error: error.message });
    }
});

// --- 3. LOGIN A USER (This route is updated) ---
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Please provide email and password." });
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isPassValid = await user.validatePassword(password);
    if (!isPassValid) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = user.generateAuthToken();
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    res.status(200).json({ 
        success: true, 
        message: "Login successful",
        data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "An internal server error occurred.", error: error.message });
  }
});


// --- 4. FORGOT PASSWORD (Updated to send OTP) ---
authRouter.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Please provide an email address." });
        }
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ success: true, message: "If an account with that email exists, an OTP has been sent." });
        }

        // --- CHANGE: Generate a 6-digit OTP ---
        const otp = user.generatePasswordResetOtp();
        await user.save({ validateBeforeSave: false });

        // --- CHANGE: Email message now contains the OTP ---
        const message = `You requested a password reset. Your OTP is: ${otp}\nThis code is valid for 10 minutes.`;
        await sendEmail({ email: user.email, subject: 'Your Password Reset OTP', message });

        res.status(200).json({ success: true, message: "If an account with that email exists, an OTP has been sent." });

    } catch (error) {
        res.status(500).json({ success: false, message: "There was an error sending the email. Please try again later." });
    }
});

// --- 5. RESET PASSWORD (Updated to use OTP) ---
authRouter.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, password, confirmPassword } = req.body;
        
        if (!email || !otp || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "Please provide email, OTP, and a new password." });
        }

        // --- CHANGE: Find user by email and the OTP they provided ---
        const user = await User.findOne({ 
            email,
            passwordResetToken: otp,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "OTP is invalid or has expired." });
        }

        user.password = password;
        user.confirmPassword = confirmPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();
        
        const token = user.generateAuthToken();
        res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully.",
            data: user,
        });

    } catch (error) {
        res.status(400).json({ success: false, message: "Failed to reset password.", error: error.message });
    }
});

// --- 6. LOGOUT A USER ---
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// --- 7. CHECK AUTHENTICATION STATUS ---
authRouter.get("/check-auth", auth, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User is authenticated",
    data: req.user,
  });
});

module.exports = { authRouter };
const express = require("express");
const profileRouter = express.Router();
const { User } = require("../models/user");
const { Property } = require("../models/property"); // Needed for deleting user's properties
const { auth } = require("../middleware/auth");
const { body, validationResult } = require('express-validator');

// --- Validation rules for the update endpoint ---
const updateProfileValidation = [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty.'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty.'),
    body('contactNumber').optional().isMobilePhone('en-IN').withMessage('Please provide a valid Indian mobile number.'),
    body('sellerType').optional().isIn(['Owner', 'Agent', 'Builder']).withMessage('Invalid seller type. Must be Owner, Agent, or Builder.')
];

// --- 1. GET CURRENT USER'S PROFILE (Optimized) ---
profileRouter.get("/api/profile/view", auth, (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user // The toJSON method in the User model automatically sanitizes this
    });
});

// --- 2. UPDATE USER'S PROFILE (Secure & Validated) ---
profileRouter.put("/api/profile/update", auth, updateProfileValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        // Whitelist the fields that are allowed to be updated for security.
        // A user should not be able to change their role or email from this endpoint.
        const { firstName, lastName, contactNumber, sellerType } = req.body;
        const updateBody = {};

        if (firstName) updateBody.firstName = firstName;
        if (lastName) updateBody.lastName = lastName;
        if (contactNumber) updateBody.contactNumber = contactNumber;
        // Only allow updating sellerType if the user is a seller
        if (req.user.role === 'seller' && sellerType) {
            updateBody.sellerType = sellerType;
        }

        const updatedUser = await User.findByIdAndUpdate(req.user.id, updateBody, {
            new: true, // Return the updated document
            runValidators: true // Ensure model validations (like the sellerType enum) are run
        });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: updatedUser
        });
    } catch (error) {
        res.status(400).json({ success: false, message: "Failed to update profile.", error: error.message });
    }
});

// --- 3. NEW: DELETE USER'S PROFILE (Secure & Comprehensive) ---
profileRouter.delete("/api/profile/delete", auth, async (req, res) => {
    try {
        const { password } = req.body;

        // Security Check 1: Password confirmation is required
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password confirmation is required to delete your account.' });
        }

        // Fetch the user with their password hash for comparison
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
             return res.status(404).json({ success: false, message: "User not found." });
        }

        // Security Check 2: Validate the provided password
        const isPasswordCorrect = await user.validatePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: 'Incorrect password.' });
        }

        // Data Integrity Step: Delete all properties listed by this user
        await Property.deleteMany({ listedBy: req.user.id });

        // Final Step: Delete the user account
        await User.findByIdAndDelete(req.user.id);

        // Clear the authentication cookie to log them out
        res.clearCookie('token');

        res.status(200).json({
            success: true,
            message: "Your account and all associated data have been permanently deleted."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred while deleting your profile.", error: error.message });
    }
});

module.exports = { profileRouter };


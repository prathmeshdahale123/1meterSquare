const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String, required: [true, "First name is required"], maxLength: 20, trim: true,
  },
  lastName: {
    type: String, required: [true, "Last name is required"], maxLength: 20, trim: true,
  },
  email: {
    type: String, required: [true, "Email is required"], unique: true, trim: true, lowercase: true, maxLength: 50, validate: [validator.isEmail, "Please provide a valid email ID"],
  },
  password: {
    type: String, required: [true, "Password is required"], minlength: 8, select: false,
  },
  role: {
    type: String, enum: ["buyer", "seller", "admin"], default: "buyer",
  },
   sellerType: {
        type: String, 
        enum: ['Owner', 'Agent', 'Builder'],
        // Mongoose allows a function for the 'required' property for conditional validation
        required: [function() { return this.role === 'seller'; }, 'Seller type (Owner, Agent, or Builder) is required.'],
    },
  contactNumber: {
    type: String, validate: [validator.isMobilePhone, "Please provide a valid contact number"],
  },
  isEmailVerified: {
    type: Boolean, default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
}, {
  timestamps: true,
});

userSchema.virtual("confirmPassword")
  .get(function() { return this._confirmPassword; })
  .set(function(value) { this._confirmPassword = value; });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!validator.isStrongPassword(this.password)) {
    throw new Error("Password must be strong (min 8 chars, uppercase, number, symbol)");
  }
  if (this.password !== this.confirmPassword) {
    throw new Error("Passwords do not match");
  }
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
  next();
});

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  delete userObject.confirmPassword;
  delete userObject._confirmPassword;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.passwordChangedAt;
  return userObject;
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  return await bcrypt.compare(passwordInputByUser, this.password);
};

userSchema.methods.generateEmailVerificationToken = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationToken = otp;
  this.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes
  return otp;
};

// --- CHANGE: Replaced the old reset token method with an OTP generator ---
userSchema.methods.generatePasswordResetOtp = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetToken = otp; // Reuse the same field for the OTP
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes
  return otp;
};

const User = mongoose.model("User", userSchema);
module.exports = { User };
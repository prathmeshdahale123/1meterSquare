const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 4,
    maxLength: 20,
  },
  lastName: {
    type: String,
    required: true,
    minLength: 4,
    maxLength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxLength: 50,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email ID");
      }
    },
  },
  password: {
    type: String,
    required: true,
    validate(value) {
      if (!validator.isStrongPassword(value)) {
        throw new Error("Password must be strong (min 8 chars, uppercase, number, symbol)");
      }
    },
  },
  role: {
    type: String,
    enum: ["buyer", "seller", "admin"],
    default: "buyer",
  },
  contactNumber: {
    type: String,
    validate(value) {
      if (!/^\d{10}$/.test(value)) {
        throw new Error("Contact number must be a 10-digit number");
      }
    },
  },
}, {
  timestamps: true
});

  

userSchema.methods.setJWT = async function () {
    const user = this;
    
    const token = await jwt.sign({_id: user._id, role: user.role}, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })
        return token;

}

userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;
    const isPassValid = await bcrypt.compare(
        passwordInputByUser,
        passwordHash
    )
        return isPassValid;
}

const User = mongoose.model("User", userSchema)

module.exports = {
    User
}

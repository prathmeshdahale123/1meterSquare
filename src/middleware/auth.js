const jwt = require("jsonwebtoken");
const { User } = require("../models/user"); // 1. Import the User model

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Authentication token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Find the user in the database using the ID from the token.
    // This ensures the user still exists and gets the latest user data.
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found." });
    }

    // 3. Attach the full, fresh user object to the request.
    // The toJSON method in your User model will automatically sanitize this.
    req.user = user;
    
    next();
  } catch (err) {
    // Catches expired tokens or other JWT errors
    return res.status(401).json({
      success: false,
      message: "Unauthorized: " + err.message,
    });
  }
};

module.exports = {
    auth
};


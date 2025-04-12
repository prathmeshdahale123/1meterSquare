// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const auth = (req, res, next) => {
  try {
    const token = req.cookies.Token;
    if (!token) throw new Error("Authentication token missing");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      _id: decoded._id,
      role: decoded.role
    };

    next();
  } catch (err) {
    res.status(401).send("Unauthorized: " + err.message);
  }
};

module.exports = {
    auth
}

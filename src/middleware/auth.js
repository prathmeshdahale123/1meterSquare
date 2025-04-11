// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.cookies.Token;
    if (!token) throw new Error("Authentication token missing");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded._id,
      role: decoded.role
    };

    next();
  } catch (err) {
    res.status(401).send("Unauthorized: " + err.message);
  }
};

module.exports = {
    auth
};

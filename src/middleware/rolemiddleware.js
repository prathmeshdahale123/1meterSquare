
const { User } = require("../models/user");


const roleCheck = (allowedRoles) => {
    return (req, res, next) => {
      try {        
        if (!req.user) throw new Error("User not authenticated");
        if (!allowedRoles.includes(req.user?.role)) {
          return res.status(403).send("Access denied: Insufficient permissions");
        }
        next();
      } catch (err) {
        res.status(403).send("Role Check Error: " + err.message);
      }
    };
  };
  
  module.exports = {
    roleCheck
  };
  
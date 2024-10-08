const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const generateToken = require("../utils/generateToken.js"); 
const protect = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
console.log("Token",req.cookies);

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ message: "Not authorized, no tokens provided" });
  }

  try {

    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    if (!user.isVerified) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Your account is not authorized. Please contact support." });
    }

    req.user = user;
    next();
  } catch (accessError) {
    if (accessError.name === 'TokenExpiredError' && refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
          return res.status(401).json({ message: "Not authorized, user not found" });
        }

        if (!user.isVerified) {
          res.clearCookie("accessToken");
          res.clearCookie("refreshToken");
          return res.status(403).json({ message: "Your account is not authorized. Please contact support." });
        }

        generateToken(res, user._id);
        
        req.user = user;
        next();
      } catch (refreshError) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(401).json({ message: "Not authorized, please login again" });
      }
    } else {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  }
};

const protectTechnician = async (req, res, next) => {

  protect(req, res, () => {
  
    if (req.user.role !== "technician") {
      return res.status(403).json({ message: "Not authorized, user is not a technician" });
    }
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(401).json({ message: "Not authorized as an admin" });
};

module.exports = { protect, verifyAdmin, protectTechnician };

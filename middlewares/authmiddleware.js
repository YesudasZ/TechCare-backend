const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const protect = async (req, res, next) => {
  let token = req.cookies.accessToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        res.status(401).json({ message: "Not authorized, invalid token" });
      }

      if (!user.isVerified) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res
          .status(403)
          .json({
            message: "Your account has been blocked. Please contact support.",
          });
        return;
      }

      req.user = user;
      next();
    } catch (err) {
      console.log(err);
      res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
};

const protectTechnician = async (req, res, next) => {
  let token = req.cookies.accessToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        res.status(401);
        throw new Error("Not authorized, technician not found");
      }

      if (user.role !== "technician") {
        res
          .status(403)
          .json({ message: "Not authorized, user is not a technician" });
      }

      if (!user.isVerified) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res
          .status(403)
          .json({
            message:
              "Your account is not verified or authorized. Please contact support.",
          });
        return;
      }

      req.user = user;
      next();
    } catch (err) {
      console.log(err);
      res.status(403).json({ message: "Not authorized, invalid token" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role == "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};

module.exports = { protect, verifyAdmin, protectTechnician };

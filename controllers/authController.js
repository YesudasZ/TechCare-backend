const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5173"
);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// const securePassword = async (password) => {
//   try {
//     const passwordHash = await bcrypt.hash(password, 10);
//     return passwordHash;
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const signup = async (req, res) => {
  try {
    let { firstName, lastName, email, password, phoneNumber } = req.body;
    const existingUser = await User.findOne({
      email: email,
      phoneNumber: phoneNumber,
    });
    if (existingUser) {
      return res.status(400).json({ message: "User or mobile already exists" });
    }

    const otp = generateOTP();
    console.log(otp);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    password = bcrypt.hashSync(password, 10);
    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      phoneNumber: phoneNumber,
      otp: hashedOtp,
      otpExpires: Date.now() + 60000,
    });

    const mailoptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP for password reset is: ${otp}. It will expire in 1 minute.`,
    };

    transporter.sendMail(mailoptions);
    res
      .status(201)
      .json({ message: "User registered. Please verify your email." });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    let { otp, email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const isValidOtp = await bcrypt.compare(otp.toString(), user.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log(error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(res, user._id);
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.coolies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed" });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const initiateForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    console.log(otp);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 60000;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}. It will expire in 1 minute.`,
    };

    transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password reset OTP sent to your email" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyForgetPasswordOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const isValidOtp = await bcrypt.compare(otp.toString(), user.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    let { newPassword, email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    newPassword = bcrypt.hashSync(newPassword, 10);
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    console.log(otp);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 60000;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "New OTP for Password Reset",
      text: `Your new OTP for password reset is: ${otp}. It will expire in 1 minute.`,
    };

    transporter.sendMail(mailOptions);
    res.status(200).json({ message: "New OTP sent to your email" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await client.getToken(code);
    const googleUser = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    const { email, given_name, family_name } = googleUser.data;
    // console.log("testing", googleUser.data);
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstName: given_name,
        lastName: family_name || "test",
        email,
        password: await bcrypt.hash(tokens.id_token, 10),
        phoneNumber: 78989,
        isVerified: true,
      });
    }

    generateToken(res, user._id);
    res.status(200).json({
      message: "User authenticated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res
      .status(500)
      .json({ message: "Server error during Google authentication" });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

module.exports = {
  signup,
  verifyOTP,
  login,
  initiateForgetPassword,
  resendOTP,
  resetPassword,
  verifyForgetPasswordOTP,
  refreshToken,
  googleAuth,
  logout,
};

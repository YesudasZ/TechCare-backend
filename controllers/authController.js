const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const Address = require("../models/Address");
const cloudinary = require("../utils/cloudinary.js");

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
  console.log("test loging");
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({
          message:
            "Your account is not verified or authorized. Please contact support.",
        });
    }
    

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(res, user._id);

    const responseUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture || "",
      role: user.role,
    };

    if (user.role === "technician") {
      responseUser.aadharNo = user.aadharNo;
      responseUser.registrationNo = user.registrationNo;
      responseUser.aadharPicture = user.aadharPicture;
      responseUser.certificatePicture = user.certificatePicture;
      responseUser.isProfileComplete = user.isProfileComplete;
      responseUser.isAuthorised = user.isAuthorised;
      responseUser.serviceCategoryId = user.serviceCategoryId;
    }
    res.status(200).json({
      message: "Login successful",
      user: responseUser,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    generateToken(res, user._id);

    const responseUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture || "",
      role: user.role,
    };

    if (user.role === "technician") {
      responseUser.aadharNo = user.aadharNo;
      responseUser.registrationNo = user.registrationNo;
      responseUser.aadharPicture = user.aadharPicture;
      responseUser.certificatePicture = user.certificatePicture;
      responseUser.isProfileComplete = user.isProfileComplete;
      responseUser.isAuthorised = user.isAuthorised;
      responseUser.serviceCategoryId = user.serviceCategoryId;
    }
    res.status(200).json({
    
      user: responseUser,
    });
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
    const { code, role } = req.body;
    const { tokens } = await client.getToken(code);
    const googleUser = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    const { email, given_name, family_name } = googleUser.data;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstName: given_name,
        lastName: family_name || "",
        email,
        password: await bcrypt.hash(tokens.id_token, 10),
        role: role || "user",
        phoneNumber: 1234567891,
        isVerified: true,
        // isProfileComplete:false,
      });
    }

    generateToken(res, user._id);

    if (role === "technician" && !user.isProfileComplete) {
      return res.status(200).json({
        message:
          "Technician authentication successful. Please complete your profile.",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || 1234567891,
          role: user.role,
          isProfileComplete: user.isProfileComplete,
        },
      });
    }

    res.status(200).json({
      message: "User authenticated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber || 1234567891,
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

const checkAuthStatus = async (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    const userId = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, phoneNumber },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateAddress = async (req, res) => {
  console.log("TEsting for pro");
  
  try {
    const { street, city, state, country, postalCode, phoneNumber, addressId } =
      req.body;
    const userId = req.user.id;

    let address;

    if (addressId) {
      address = await Address.findOneAndUpdate(
        { _id: addressId, user: userId },
        { street, city, state, country, postalCode, phoneNumber },
        { new: true }
      );
      if (!address) {
        console.log("lsjldkfjl");

        return res.status(404).json({ message: "Address not found" });
      }
    } else {
      console.log("lsjldkfjl test okay");
      address = await Address.create({
        user: userId,
        street,
        city,
        state,
        country,
        postalCode,
        phoneNumber,
      });
    }

    res.status(200).json({ message: "Address updated successfully", address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.find({ user: userId });
    res.status(200).json({ addresses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id;

    const result = await Address.findOneAndDelete({
      _id: addressId,
      user: userId,
    });

    if (!result) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user.id;

    const result = await cloudinary.uploader.upload(image, {
      folder: "techcare/user_profile_pictures",
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: updatedUser.profilePicture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
  checkAuthStatus,
  updateProfile,
  updateAddress,
  getUserAddresses,
  deleteAddress,
  updatePassword,
  updateProfilePicture,
};

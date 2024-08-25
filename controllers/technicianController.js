const cloudinary = require("../utils/cloudinary.js");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

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
    let {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      registrationNo,
      aadharNo,
      aadharPicture,
      certificatePicture,
    } = req.body;

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

    const aadharPictureResult = await cloudinary.uploader.upload(
      aadharPicture,
      {
        folder: "techcare/aadhar_pictures",
      }
    );
    const certificatePictureResult = await cloudinary.uploader.upload(
      certificatePicture,
      {
        folder: "techcare/certificate_pictures",
      }
    );
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      registrationNo,
      aadharNo,
      aadharPicture: aadharPictureResult.secure_url,
      certificatePicture: certificatePictureResult.secure_url,
      role: "technician",
      otp: hashedOtp,
      otpExpires: Date.now() + 60000,
    });

    const mailoptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP for account verification is: ${otp}. It will expire in 1 minute.`,
    };

    transporter.sendMail(mailoptions);
    res
      .status(201)
      .json({ message: "Technician registered. Please verify your email." });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  signup,
};

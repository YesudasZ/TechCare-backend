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

// const signup = async (req, res) => {
//   try {
//     let {
//       firstName,
//       lastName,
//       email,
//       password,
//       phoneNumber,
//       registrationNo,
//       aadharNo,
//       aadharPicture,
//       certificatePicture,
//     } = req.body;

//     const existingUser = await User.findOne({
//       email: email,
//       phoneNumber: phoneNumber,
//     });

//     if (existingUser) {
//       return res.status(400).json({ message: "User or mobile already exists" });
//     }

//     const otp = generateOTP();
//     console.log(otp);
//     const hashedOtp = await bcrypt.hash(otp.toString(), 10);
//     password = bcrypt.hashSync(password, 10);

//     // const fileType1 = certificatePicture.split(';')[0].split('/')[1];
//     // let certificatePictureResult;
//     // if (fileType1 === 'pdf') {
//     //   certificatePictureResult = await cloudinary.uploader.upload(certificateFile, {
//     //     folder: "techcare/certificate_pictures",
//     //     resource_type: "auto",
//     //   });
//     // } else {
//     //   certificatePictureResult = await cloudinary.uploader.upload(certificateFile, {
//     //     folder: "techcare/certificate_pictures",
//     //   });
//     // }

//     // const fileType2 = aadharPicture.split(';')[0].split('/')[1];
//     // let aadharPictureResult;
//     // if (fileType2 === 'pdf') {
//     //   aadharPictureResult = await cloudinary.uploader.upload(certificateFile, {
//     //     folder: "techcare/aadhar_picture",
//     //     resource_type: "auto",
//     //   });
//     // } else {
//     //   aadharPictureResult = await cloudinary.uploader.upload(certificateFile, {
//     //     folder: "techcare/aadhar_picture",
//     //   });
//     // }

//     const aadharPictureResult = await cloudinary.uploader.upload(
//       aadharPicture,
//       {
//         folder: "techcare/aadhar_pictures",
//         resource_type: "auto",
//       }
//     );
//     const certificatePictureResult = await cloudinary.uploader.upload(
//       certificatePicture,
//       {
//         folder: "techcare/certificate_pictures",
//         resource_type: "auto",
//       }
//     );
//     const user = await User.create({
//       firstName,
//       lastName,
//       email,
//       password,
//       phoneNumber,
//       registrationNo,
//       aadharNo,
//       aadharPicture: aadharPictureResult.secure_url,
//       certificatePicture: certificatePictureResult.secure_url,
//       role: "technician",
//       otp: hashedOtp,
//       otpExpires: Date.now() + 60000,
//     });

//     const mailoptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "OTP Verification",
//       text: `Your OTP for account verification is: ${otp}. It will expire in 1 minute.`,
//     };

//     transporter.sendMail(mailoptions);
//     res
//       .status(201)
//       .json({ message: "Technician registered. Please verify your email." });
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

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
        resource_type: "auto",
      }
    );
    const certificatePictureResult = await cloudinary.uploader.upload(
      certificatePicture,
      {
        folder: "techcare/certificate_pictures",
        resource_type: "auto",
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
      isProfileComplete: true
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

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    const technicianId = req.user.id;
    const updatedTechnician = await User.findByIdAndUpdate(
      technicianId,
      { firstName, lastName, phoneNumber },
      { new: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedTechnician._id,
        firstName: updatedTechnician.firstName,
        lastName: updatedTechnician.lastName,
        email: updatedTechnician.email,
        phoneNumber: updatedTechnician.phoneNumber,
        role: updatedTechnician.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const technicianId = req.user.id;
    const technician = await User.findById(technicianId);
    const isMatch = await bcrypt.compare(currentPassword, technician.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    technician.password = hashedPassword;
    await technician.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    const { image } = req.body;
    const technicianId = req.user.id;

    const result = await cloudinary.uploader.upload(image, {
      folder: "techcare/technician_profile_pictures",
    });

    const updatedTechnician = await User.findByIdAndUpdate(
      technicianId,
      { profilePicture: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicture: updatedTechnician.profilePicture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const completeProfile = async (req, res) => {
  try {
    const { registrationNo, aadharNo, aadharPicture, certificatePicture } = req.body;
    const technician = await User.findById(req.user._id);

    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    const aadharPictureResult = await cloudinary.uploader.upload(aadharPicture, {
      folder: "techcare/aadhar_pictures",
      resource_type: "auto",
    });

    const certificatePictureResult = await cloudinary.uploader.upload(certificatePicture, {
      folder: "techcare/certificate_pictures",
      resource_type: "auto",
    });

    technician.registrationNo = registrationNo;
    technician.aadharNo = aadharNo;
    technician.aadharPicture = aadharPictureResult.secure_url;
    technician.certificatePicture = certificatePictureResult.secure_url;
    technician.isProfileComplete = true;

    await technician.save();

    res.status(200).json({
      message: "Technician profile completed successfully",
      user: {
        id: technician._id,
        firstName: technician.firstName,
        lastName: technician.lastName,
        email: technician.email,
        phoneNumber: technician.phoneNumber,
        role: technician.role,
        isProfileComplete: technician.isProfileComplete,
      },
    });
  } catch (error) {
    console.error("Complete Profile Error:", error);
    res.status(500).json({ message: "Server error while completing profile" });
  }
};
 
module.exports = {
  signup,
  updateProfile,
  updatePassword,
  updateProfilePicture,
  completeProfile
};

const cloudinary = require("../utils/cloudinary.js");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Service = require('../models/Service');
const moment = require('moment');
const { Wallet, Transaction } = require("../models/Wallet.js")

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

const getServiceRequests = async (req, res) => {
  try {
    const { serviceCategoryId } = req.user;
    
    const serviceRequests = await Service.find({
      serviceCategory: serviceCategoryId,
      status: 'pending',
      technician: { $exists: false }
    }).populate('user', 'firstName lastName')
      .populate('serviceType', 'name')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json(serviceRequests);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const acceptServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const technicianId = req.user._id;

    const serviceRequest = await Service.findById(requestId);

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (serviceRequest.technician) {
      return res.status(400).json({ message: 'This request has already been accepted by another technician' });
    }

    serviceRequest.technician = technicianId;
    serviceRequest.status = 'accepted';
    await serviceRequest.save();

    res.status(200).json({ message: 'Service request accepted successfully' });
  } catch (error) {
    console.error('Error accepting service request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAcceptedServices = async (req, res) => {
  try {
    const technicianId = req.user._id;
    
    const acceptedServices = await Service.find({
      technician: technicianId,
      status: { $in: ['accepted', 'in-progress', 'completed'] }
    }).populate('user', 'firstName lastName profilePicture')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json(acceptedServices);
  } catch (error) {
    console.error('Error fetching accepted services:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateServiceStatus = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;
    const technicianId = req.user._id;

    const service = await Service.findOne({ _id: serviceId, technician: technicianId });

    if (!service) {
      return res.status(404).json({ message: 'Service not found or not assigned to this technician' });
    }

    if (!['accepted', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    service.status = status;
    await service.save();

    res.status(200).json({ message: 'Service status updated successfully' });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getWeeklyServices = async (req, res) => {
  try {
    const { week } = req.query;
    const technician = req.user._id;

    let startDate, endDate;
    if (week === 'This Week') {
      startDate = moment().startOf('week');
      endDate = moment().endOf('week');
    } else if (week === 'Last Week') {
      startDate = moment().subtract(1, 'weeks').startOf('week');
      endDate = moment().subtract(1, 'weeks').endOf('week');
    } else if (week === 'Two Weeks Ago') {
      startDate = moment().subtract(2, 'weeks').startOf('week');
      endDate = moment().subtract(2, 'weeks').endOf('week');
    }

    const services = await Service.find({
      technician,
      appointmentDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    });

    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const day = startDate.clone().add(i, 'days');
      const dayServices = services.filter(service => 
        moment(service.appointmentDate).isSame(day, 'day')
      );
      
      weeklyData.push({
        day: day.format('ddd'),
        completed: dayServices.filter(service => service.status === 'completed').length,
        pending: dayServices.filter(service => service.status !== 'completed').length
      });
    }

    res.json(weeklyData);
  } catch (error) {
    console.error('Error fetching weekly services:', error);
    res.status(500).json({ message: 'Error fetching weekly services' });
  }
};

const getWeeklyEarnings = async (req, res) => {
  try {
    const { week } = req.query;
    const technician = req.user._id;

    let startDate, endDate;
    if (week === 'This Week') {
      startDate = moment().startOf('week');
      endDate = moment().endOf('week');
    } else if (week === 'Last Week') {
      startDate = moment().subtract(1, 'weeks').startOf('week');
      endDate = moment().subtract(1, 'weeks').endOf('week');
    } else if (week === 'Two Weeks Ago') {
      startDate = moment().subtract(2, 'weeks').startOf('week');
      endDate = moment().subtract(2, 'weeks').endOf('week');
    }

    const wallet = await Wallet.findOne({ user: technician });
    const transactions = await Transaction.find({
      _id: { $in: wallet.transactions },
      type: 'credit',
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
    }).populate({
      path: 'service',
      populate: {
        path: 'serviceType'
      }
    });

    const earningsByType = {
      'Repair': 0,
      'Installation': 0,
      'Maintenance': 0
    };

    transactions.forEach(transaction => {
      if (transaction.service && transaction.service.serviceType) {
        const serviceTypeName = transaction.service.serviceType.name;
        if (earningsByType.hasOwnProperty(serviceTypeName)) {
          earningsByType[serviceTypeName] += transaction.amount;
        }
      }
    });

    const weeklyEarnings = Object.entries(earningsByType).map(([name, value]) => ({
      name,
      value
    }));

    res.json(weeklyEarnings);
  } catch (error) {
    console.error('Error fetching weekly earnings:', error);
    res.status(500).json({ message: 'Error fetching weekly earnings' });
  }
};
module.exports = {
  signup,
  updateProfile,
  updatePassword,
  updateProfilePicture,
  completeProfile,
  getServiceRequests,
  acceptServiceRequest,
  getAcceptedServices,
  updateServiceStatus,
  getWeeklyServices,
  getWeeklyEarnings
};

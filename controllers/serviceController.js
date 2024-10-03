const ServiceCategory = require("../models/ServiceCategory");
const ServiceType = require("../models/ServiceType");
const Service = require("../models/Service.js");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary.js");
const Report = require("../models/Report.js");
const { Wallet, Transaction } = require("../models/Wallet.js");
const getAdminWallet = require("../utils/getAdminWallet.js");

const getServiceCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find().select("name imageUrl");
    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching service categories",
      error: error.message,
    });
  }
};

const getServiceTypes = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: "Category ID is required" });
    }
    const serviceTypes = await ServiceType.find({
      serviceCategory: category,
    }).select("name description rate imageUrl");
    res.json(serviceTypes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching service types", error: error.message });
  }
};

const getServiceType = async (req, res) => {
  try {
    const id = req.params.id;
    const serviceType = await ServiceType.findById(String(id));

    res.json(serviceType);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching service types", error: error.message });
  }
};

const seviceRequest = async (req, res) => {
  try {
    const {
      serviceType,
      appointmentDate,
      appointmentTime,
      address,
      amount,
      paymentId,
    } = req.body;

    const serviceTypeDoc = await ServiceType.findById(serviceType);
    if (!serviceTypeDoc) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    const serviceCategoryDoc = await ServiceCategory.findById(
      serviceTypeDoc.serviceCategory
    );
    if (!serviceCategoryDoc) {
      return res.status(400).json({ message: "Invalid service category" });
    }

    const parsedDate = new Date(appointmentDate);
    const [hours, minutes] = appointmentTime.split(":");
    const parsedTime = new Date(parsedDate);
    parsedTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    const newService = new Service({
      user: req.user._id,
      serviceCategory: serviceCategoryDoc._id,
      serviceType: serviceTypeDoc._id,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country,
        postalCode: address.postalCode,
        phoneNumber: address.phoneNumber,
      },
      appointmentDate: parsedDate,
      appointmentTime: parsedTime,
      categoryName: serviceCategoryDoc.name,
      serviceName: serviceTypeDoc.name,
      serviceDescription: serviceTypeDoc.description,
      servicePicture: serviceTypeDoc.imageUrl[0],
      serviceRate: serviceTypeDoc.rate,
      status: "pending",
      amount: amount,
      paymentStatus: "paid",
      paymentMethod: "Razorpay",
      paymentId: paymentId,
    });

    await newService.save();
    const adminWallet = await getAdminWallet();
    adminWallet.balance += amount;
    const adminTransaction = new Transaction({
      user: adminWallet.user,
      amount: amount,
      type: "credit",
      description: `Payment received for service: ${newService.serviceName}`,
      service: newService._id,
    });
    await adminTransaction.save();
    adminWallet.transactions.push(adminTransaction._id);
    await adminWallet.save();
    res.status(201).json({
      message: "Service request created successfully",
      service: newService,
    });
  } catch (error) {
    console.error("Detailed error in service request:", error);
    res.status(500).json({
      message: "Error creating service request",
      error: error.toString(),
    });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Service.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("serviceCategory", "name")
      .populate("serviceType", "name description")
      .populate("technician", "firstName lastName profilePicture phoneNumber")
      .populate({
        path: "feedback",
        select: "rating feedback createdAt",
        populate: {
          path: "user",
          select: "firstName lastName profilePicture",
        },
      })
      .populate("report", "status");

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.toString() });
  }
};

const addFeedback = async (req, res) => {
  try {
    const { serviceId, rating, feedback } = req.body;
    const userId = req.user._id;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to leave feedback for this service",
      });
    }

    const newFeedback = new Feedback({
      service: serviceId,
      technician: service.technician,
      user: userId,
      rating,
      feedback,
    });

    await newFeedback.save();

    service.feedback = newFeedback._id;
    await service.save();

    const technicianFeedbacks = await Feedback.find({
      technician: service.technician,
    });
    const totalRating = technicianFeedbacks.reduce(
      (sum, feedback) => sum + feedback.rating,
      0
    );
    const averageRating = totalRating / technicianFeedbacks.length;

    await User.findByIdAndUpdate(service.technician, {
      $set: { averageRating },
    });

    const updatedService = await Service.findById(serviceId).populate(
      "feedback"
    );

    res.status(201).json({
      message: "Feedback submitted successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Error in addFeedback:", error);
    res
      .status(500)
      .json({ message: "An error occurred while submitting feedback" });
  }
};

const submitReport = async (req, res) => {
  try {
    const { serviceId, reportNote, reportImages } = req.body;
    const userId = req.user._id;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to submit a report for this service",
      });
    }

    const uploadImages = [];
    for (const image of reportImages) {
      const uploadImage = await cloudinary.uploader.upload(image, {
        folder: "techcare/report",
      });
      uploadImages.push(uploadImage.secure_url);
    }

    const newReport = new Report({
      service: serviceId,
      technician: service.technician,
      user: userId,
      description: reportNote,
      imageUrls: uploadImages,
    });

    await newReport.save();
    service.report = newReport._id;

    await service.save();
    const updatedService = await Service.findById(serviceId).populate("report");

    res
      .status(201)
      .json({
        message: "Report submitted successfully",
        report: newReport,
        updatedService: updatedService,
      });
  } catch (error) {}
};

const cancelService = async (req, res) => {
  try {
    const { serviceId, reason } = req.body;
    const userId = req.user._id;
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (service.status === "completed" || service.status === "cancelled") {
      return res.status(403).json({
        message: "Cannot cancel this service",
      });
    }
    service.status = "cancelled";
    service.reason = reason;
    await service.save();

    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = new Wallet({ user: userId });
    }
    wallet.balance += service.amount;
    await wallet.save();

    const transaction = new Transaction({
      user: userId,
      amount: service.amount,
      type: "credit",
      description: `Refund for cancelled service: ${service.serviceName}`,
      service: serviceId,
    });
    await transaction.save();

    wallet.transactions.push(transaction._id);
    await wallet.save();

    const adminWallet = await getAdminWallet();
    adminWallet.balance -= service.amount;
    const adminTransaction = new Transaction({
      user: adminWallet.user,
      amount: service.amount,
      type: "debit",
      description: `Refund issued for cancelled service: ${service.serviceName}`,
      service: serviceId,
    });
    await adminTransaction.save();

    adminWallet.transactions.push(adminTransaction._id);
    await adminWallet.save();

    res.status(200).json({ message: "Service cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling service:", error);
    res.status(500).json({ message: "Error cancelling service" });
  }
};

const getServiceRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || '';

    let query = Service.find();
    if (searchQuery) {
      query = query.populate({
        path: 'user',
        match: {
          $or: [
            { firstName: { $regex: searchQuery, $options: 'i' } },
            { lastName: { $regex: searchQuery, $options: 'i' } }
          ]
        },
        select: 'firstName lastName profilePicture'
      });
    } else {
      query = query.populate('user', 'firstName lastName profilePicture');
    }
    query = query
      .populate('technician', 'firstName lastName')
      .populate('serviceCategory', 'name')
      .populate('serviceType', 'name');

    const totalServices = await Service.countDocuments();
    const services = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const filteredServices = searchQuery
      ? services.filter(service => service.user !== null)
      : services;

    res.json({
      services: filteredServices,
      currentPage: page,
      totalPages: Math.ceil(totalServices / limit),
      totalServices: totalServices,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching service requests', 
      error: error.message 
    });
  }
};


module.exports = {
  getServiceCategories,
  getServiceTypes,
  getServiceType,
  seviceRequest,
  getUserBookings,
  addFeedback,
  submitReport,
  cancelService,
  getServiceRequests
};

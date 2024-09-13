const ServiceCategory = require("../models/ServiceCategory");
const ServiceType = require("../models/ServiceType");
const Service = require('../models/Service.js')
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getServiceCategories = async (req, res) => {
  try {
    const categories = await ServiceCategory.find().select("name imageUrl");
    res.json(categories);
  } catch (error) {
    res 
      .status(500)
      .json({
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
    const serviceType = await ServiceType.findById(String(id))
   
      
    res.json(serviceType);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching service types", error: error.message });
  }
};

const createService = async ( req, res) => {
 try {
     const {amount,currency, receipt} = req.body;
     const options = {
       amount:amount,
       currency:currency,
       receipt:receipt,
     };
     const order = await razorpay.orders.create(options);

     res.status(200).json({order});
 } catch (error) {
  console.error(error);
   res.status(500).json({ message: "Error creating order", error: error.message });
 }
}

const verifyRazorpay  = async (req, res) =>{

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying payment", error: error.message });
  }
}

const seviceRequest = async(req, res ) =>{
  try {
    const {
      serviceType,
      appointmentDate,
      appointmentTime,
      address,
      amount,
      paymentId
    } = req.body;

    const serviceTypeDoc = await ServiceType.findById(serviceType);
    if (!serviceTypeDoc) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    const serviceCategoryDoc = await ServiceCategory.findById(serviceTypeDoc.serviceCategory);
    if (!serviceCategoryDoc) {
      return res.status(400).json({ message: "Invalid service category" });
    }

    const parsedDate = new Date(appointmentDate);
    const [hours, minutes] = appointmentTime.split(':');
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
      status: 'pending',
      amount: amount,
      paymentStatus: 'paid',
      paymentMethod: 'Razorpay',
      paymentId: paymentId,
    });

    await newService.save();

    res.status(201).json({ message: "Service request created successfully", service: newService });
  } catch (error) {
    console.error("Detailed error in service request:", error);
    res.status(500).json({ message: "Error creating service request", error: error.toString() });
  }
}

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Service.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('serviceCategory', 'name')
      .populate('serviceType', 'name description')
      // .populate('technician', 'firstName lastName');

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error: error.toString() });
  }
};



module.exports = {
  getServiceCategories,
  getServiceTypes,
  getServiceType,
  createService,
  verifyRazorpay,
  seviceRequest,
  getUserBookings
};  

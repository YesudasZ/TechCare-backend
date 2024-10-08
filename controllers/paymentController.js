const Razorpay = require("razorpay");
const crypto = require("crypto");
const { Wallet, Transaction } = require("../models/Wallet.js")
const getAdminWallet = require("../utils/getAdminWallet.js");
const Service = require("../models/Service.js");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createService = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    const options = {
      amount: amount,
      currency: currency,
      receipt: receipt,
    };
    const order = await razorpay.orders.create(options);

    res.status(200).json({ order });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      res
        .status(200)
        .json({ success: true, message: "Payment verified successfully" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error verifying payment", error: error.message });
  }
};

const getWalletBalance = async (req, res) =>{
    try {
      const userId = req.user._id;
      let wallet = await Wallet.findOne({user:userId});
      if (!wallet) {
           wallet = new Wallet({user:userId})
           await wallet.save();
      }
      res.status(200).json({ balance: wallet.balance });
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      res.status(500).json({ message: "Error fetching wallet balance" });
    }
  }
  
  const getWalletTransactions = async (req,res) =>{
    try {
      const userId = req.user._id;
      let wallet = await Wallet.findOne({ user:userId }).populate({
        path:'transactions',
        populate: { path: 'service'},
        options:{sort:{date:-1}}
      })
      if (!wallet) {
        wallet = new Wallet({user:userId})
           await wallet.save();
      }
      res.status(200).json({ transactions:wallet.transactions });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Error fetching transactions" });
    }
  }

  const getAdminWalletBalance = async (req, res) => {
    try {
      const adminWallet = await getAdminWallet();
      res.status(200).json({ balance: adminWallet.balance });
    } catch (error) {
      console.error("Error fetching admin wallet balance:", error);
      res.status(500).json({ message: "Error fetching admin wallet balance" });
    }
  };
  
  const getAdminWalletTransactions = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const adminWallet = await getAdminWallet();
      const total = adminWallet.transactions.length;
      
      const populatedWallet = await Wallet.findById(adminWallet._id)
        .populate({
          path: 'transactions',
          options: {
            sort: { date: -1 },
            skip: skip,
            limit: limit
          },
          populate: { path: 'service' }
        });
  
      res.status(200).json({
        transactions: populatedWallet.transactions,
        total: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error fetching admin transactions:", error);
      res.status(500).json({ message: "Error fetching admin transactions" });
    }
  };

  const processTechnicianPayment = async (req, res) => {
    try {
      const { serviceId } = req.params;
      const service = await Service.findById(serviceId)
        .populate('technician')
        .populate('user', 'firstName lastName');
      
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
  
      if (service.status !== 'completed') {
        return res.status(400).json({ message: 'Service must be completed before payment' });
      }
  
      if (service.isPayTechnician) {
        return res.status(400).json({ message: 'Payment already processed' });
      }
  
      const adminWallet = await getAdminWallet();
      let technicianWallet = await Wallet.findOne({ user: service.technician._id });
      if (!technicianWallet) {
        technicianWallet = new Wallet({ user:service.technician._id });
        await technicianWallet.save();
        
      }
      const paymentAmount = service.amount * 0.9; 
         console.log("Payamt",paymentAmount);
         console.log("srvamout",service.amount)
         
      if (adminWallet.balance < paymentAmount) {
        return res.status(400).json({ message: 'Insufficient balance in admin wallet' });
      }
  
      const adminTransaction = new Transaction({
        user: adminWallet.user,
        type: 'debit',
        amount: paymentAmount,
        description: `Payment to technician for service #${serviceId}`,
        service: serviceId
      });
  
      const technicianTransaction = new Transaction({
        user: service.technician._id,
        type: 'credit',
        amount: paymentAmount,
        description: `Payment received for service #${serviceId}`,
        service: serviceId
      });
  
      adminWallet.balance -= paymentAmount;
      adminWallet.transactions.push(adminTransaction._id);
      service.isPayTechnician = true
      technicianWallet.balance += paymentAmount;
      technicianWallet.transactions.push(technicianTransaction._id);
      await Promise.all([
        adminTransaction.save(),
        technicianTransaction.save(),
        adminWallet.save(),
        technicianWallet.save(),
        service.save()
      ]);
  
      res.json({ message: 'Payment processed successfully', service });
    } catch (error) {
      res.status(500).json({ message: 'Error processing payment', error: error.message });
    }
  };

  const getTechnicianWalletBalance = async (req, res) => {
    try {
      let technicianWallet = await Wallet.findOne({ user: req.user._id });
  
      if (!technicianWallet) {
         technicianWallet = new Wallet({ user: req.user._id });
         await technicianWallet.save();
      }
  
      res.status(200).json({ balance: technicianWallet.balance });
    } catch (error) {
      console.error("Error fetching technician wallet balance:", error);
      res.status(500).json({ message: "Error fetching technician wallet balance" });
    }
  };
  
  const getTechnicianWalletTransactions = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const technicianWallet = await Wallet.findOne({ user: req.user._id });
      if (!technicianWallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
  
      const total = technicianWallet.transactions.length;
  
      const populatedWallet = await Wallet.findById(technicianWallet._id)
        .populate({
          path: 'transactions',
          options: {
            sort: { date: -1 },
            skip: skip,
            limit: limit
          },
          populate: { path: 'service' }
        });
  
      res.status(200).json({
        transactions: populatedWallet.transactions,
        total: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching technician transactions:", error);
      res.status(500).json({ message: "Error fetching technician transactions" });
    }
  };

  const handleWalletPayment = async (req, res) => {
    try {
      const { amount, serviceId, serviceName } = req.body;
      const user = req.user;

      const wallet = await Wallet.findOne({ user: user._id });
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      wallet.balance -= amount;
      const transaction = new Transaction({
        user: user._id,
        type: "debit",
        amount,
        description: `Payment for service ${serviceName}`,
        service: serviceId,
      });
  
      await transaction.save();
      wallet.transactions.push(transaction);
      await wallet.save();
  
      res.status(200).json({ success: true, message: "Payment successful" });
    } catch (error) {
      console.error("Wallet payment error:", error);
      res.status(500).json({ message: "Payment failed", error });
    }
  };
  

  module.exports = {
    createService,
    verifyRazorpay,
    getWalletBalance,
    getWalletTransactions,
    getAdminWalletBalance,
    getAdminWalletTransactions,
    processTechnicianPayment,
    getTechnicianWalletBalance,
    getTechnicianWalletTransactions,
    handleWalletPayment
  };
const express = require('express');
const {
  signup, 
  verifyOTP, 
  resendOTP, 
  login, 
  refreshToken, 
  initiateForgetPassword, 
  verifyForgetPasswordOTP, 
  resetPassword, 
  googleAuth, 
  logout, 
  checkAuthStatus, 
  updateProfile, 
  updateAddress, 
  getUserAddresses, 
  deleteAddress, 
  updatePassword, 
  updateProfilePicture
} = require('../controllers/authController');

const { 
  getServiceCategories, 
  getServiceTypes, 
  getServiceType,  
  seviceRequest, 
  getUserBookings,
  addFeedback,
  submitReport, 
  cancelService,
} = require('../controllers/serviceController');

const {
  getChatHistory, 
  sendMessage, 
  getNotifications, 
  markNotificationAsRead, 
  clearAllNotifications, 
  removeNotification, 
  markMessagesAsRead
} = require('../controllers/chatController');

const{
  createService, 
  verifyRazorpay, 
  getWalletBalance,
  getWalletTransactions
} = require('../controllers/paymentController')

const { protect } = require('../middlewares/authmiddleware');
const router = express.Router();

// Auth Routes
router.post('/signup', signup);
router.post('/verifyOTP', verifyOTP);
router.post('/resendOTP', resendOTP);
router.post('/login', login);
router.post('/refreshToken', refreshToken);
router.post('/forget-password/initiate', initiateForgetPassword);
router.post('/forget-password/verify-otp', verifyForgetPasswordOTP);
router.patch('/forget-password/reset', resetPassword);  
router.post('/google', googleAuth);
router.post('/logout', logout);
router.get('/status', checkAuthStatus);
router.get('/wallet-balance', protect, getWalletBalance)
router.get('/wallet-transactions', protect, getWalletTransactions)


// Service Routes
router.get('/service-categories', getServiceCategories);
router.get('/service-types', getServiceTypes);
router.get('/service-type/:id', getServiceType);
router.post('/payment/create-order', protect, createService);
router.post('/payment/verify', protect, verifyRazorpay);
router.post('/service/create', protect, seviceRequest);
router.get('/user-bookings', protect, getUserBookings);
router.post('/feedback', protect, addFeedback);
router.post('/submit-report', protect, submitReport);
router.put('/cancel-service', protect, cancelService)

// Profile and Address Routes
router.put('/update-profile', protect, updateProfile);
router.patch('/update-address', protect, updateAddress);  
router.get('/addresses', protect, getUserAddresses);
router.delete('/address/:addressId', protect, deleteAddress);
router.put('/update-password', protect, updatePassword);
router.patch('/update-profile-picture', protect, updateProfilePicture);  

// Chat and Notifications Routes
router.get('/chat-history/:serviceId', protect, getChatHistory);
router.post('/send-message', protect, sendMessage);
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markNotificationAsRead);  
router.delete('/notifications', protect, clearAllNotifications);
router.delete('/notifications/:id', protect, removeNotification);
router.put('/mark-messages-read', protect, markMessagesAsRead);
  
module.exports = router;

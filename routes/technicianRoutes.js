const express = require('express');
const { 
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
} = require('../controllers/technicianController');
const {
  getTechnicianWalletBalance,
  getTechnicianWalletTransactions
} = require('../controllers/paymentController')
const { protectTechnician } = require('../middlewares/authmiddleware');

const router = express.Router();

// Technician Authentication and Profile Routes
router.post('/signup', signup);
router.put('/update-profile', protectTechnician, updateProfile);
router.put('/update-password', protectTechnician, updatePassword);
router.patch('/update-profile-picture', protectTechnician, updateProfilePicture);  
router.patch('/complete-profile', protectTechnician, completeProfile);  

// Technician Service Management Routes
router.get('/service-requests', protectTechnician, getServiceRequests);
router.patch('/accept-request/:requestId', protectTechnician, acceptServiceRequest); 
router.get('/accepted-services', protectTechnician, getAcceptedServices);
router.patch('/update-service-status/:serviceId', protectTechnician, updateServiceStatus); 

// Technician Payment Management Routes
router.get('/wallet-balance', protectTechnician, getTechnicianWalletBalance);
router.get('/wallet-transactions', protectTechnician, getTechnicianWalletTransactions);
router.get('/weekly-services', protectTechnician, getWeeklyServices);
router.get('/weekly-earnings', protectTechnician, getWeeklyEarnings);

module.exports = router;

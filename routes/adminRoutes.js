const express = require('express');
const { 
  listUsers, 
  toggleBlockUser, 
  toggleAuthorizeTechnician, 
  createServiceCategory, 
  updateServiceCategory, 
  deleteServiceCategory, 
  getServiceCategories, 
  createServiceType, 
  updateServiceType, 
  deleteServiceType, 
  getServiceTypes,
  getReports,
  updateReportStatus,
  toggleBlockTechnician ,
  getDashboardStats
} = require('../controllers/adminController');

const { getServiceRequests } = require('../controllers/serviceController')

const {
  getAdminWalletBalance,
  getAdminWalletTransactions,
  processTechnicianPayment
} = require("../controllers/paymentController")
const { protect, verifyAdmin } = require('../middlewares/authmiddleware');
const router = express.Router();

router.use(protect);
router.use(verifyAdmin);

// User Management
router.get('/users', listUsers);
router.patch('/users/:userId/block', toggleBlockUser);
router.patch('/users/:userId/authorize', toggleAuthorizeTechnician);

// Service Categories
router.post('/service-categories', createServiceCategory); 
router.patch('/service-categories/:id', updateServiceCategory); 
router.delete('/service-categories/:id', deleteServiceCategory);
router.get('/service-categories', getServiceCategories);

// Service Types
router.post('/service-types', createServiceType); 
router.patch('/service-types/:id', updateServiceType); 
router.delete('/service-types/:id', deleteServiceType);
router.get('/service-types', getServiceTypes);
router.get('/service-requests', getServiceRequests)
router.post('/pay-technician/:serviceId',processTechnicianPayment)

// Wallet routes
router.get('/wallet-balance',getAdminWalletBalance);
router.get('/wallet-transactions',getAdminWalletTransactions);

// Report routes
router.get('/reports', getReports);
router.patch('/reports/:reportId/status', updateReportStatus);
router.patch('/reports/:reportId/block-technician', toggleBlockTechnician);

// Dashboard route
router.get('/dashboard-stats', protect, verifyAdmin, getDashboardStats);

module.exports = router;

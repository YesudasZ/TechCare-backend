const express = require('express');
const authController = require('../controllers/authController');
const serviceController = require('../controllers/serviceController')
const {protect} = require('../middlewares/authmiddleware')
const router = express.Router();
// const {signup } = authController
  
router.post('/signup',authController.signup)
router.post('/verifyOTP',authController.verifyOTP)
router.post('/resendOTP', authController.resendOTP);
router.post('/login',authController.login)
router.post('/refreshToken',authController.refreshToken)
router.post('/forget-password/initiate', authController.initiateForgetPassword);
router.post('/forget-password/verify-otp',authController.verifyForgetPasswordOTP);
router.post('/forget-password/reset', authController.resetPassword);
router.post('/google', authController.googleAuth);
router.post('/logout',authController.logout)
router.get('/status', authController.checkAuthStatus);
router.get('/service-categories', serviceController.getServiceCategories);
router.get('/service-types', serviceController.getServiceTypes); 
router.get('/service-type/:id', serviceController.getServiceType);

router.post("/payment/create-order", protect, serviceController.createService );
router.post('/payment/verify', protect, serviceController.verifyRazorpay)
router.post('/service/create', protect, serviceController.seviceRequest)
router.get('/user-bookings',protect,serviceController.getUserBookings)

router.put('/update-profile',protect, authController.updateProfile);
router.put('/update-address',protect, authController.updateAddress);
router.get('/addresses' ,protect, authController.getUserAddresses);
router.delete('/address/:addressId',protect, authController.deleteAddress);
router.put('/update-password',protect, authController.updatePassword);
router.post('/update-profile-picture',protect, authController.updateProfilePicture);
module.exports = router; 
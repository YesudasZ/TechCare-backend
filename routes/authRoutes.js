const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

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

module.exports = router;
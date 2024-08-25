const express = require('express');
const adminController = require('../controllers/adminController');
const router = express.Router();

router.get('/users', adminController.listUsers);
router.patch('/users/:userId/block', adminController.toggleBlockUser);
router.patch('/users/:userId/authorize', adminController.toggleAuthorizeTechnician);

module.exports = router;


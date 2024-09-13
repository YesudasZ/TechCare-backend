const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, verifyAdmin } = require('../middlewares/authmiddleware');
const router = express.Router();

router.use(protect);
router.use(verifyAdmin);
 
router.get('/users', adminController.listUsers);
router.patch('/users/:userId/block', adminController.toggleBlockUser);
router.patch('/users/:userId/authorize', adminController.toggleAuthorizeTechnician);
      
router.post('/service-categories', adminController.createServiceCategory);
router.put('/service-categories/:id', adminController.updateServiceCategory);
router.delete('/service-categories/:id', adminController.deleteServiceCategory);
router.get('/service-categories', adminController.getServiceCategories);

router.post('/service-types', adminController.createServiceType);
router.put('/service-types/:id', adminController.updateServiceType);
router.delete('/service-types/:id', adminController.deleteServiceType);
router.get('/service-types', adminController.getServiceTypes);

module.exports = router;

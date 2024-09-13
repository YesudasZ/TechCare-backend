const express = require('express');
const technicianController = require('../controllers/technicianController');
const { protectTechnician } = require('../middlewares/authmiddleware');
const router = express.Router();

router.post('/signup', technicianController.signup);
router.put('/update-profile', protectTechnician, technicianController.updateProfile);
router.put('/update-password', protectTechnician, technicianController.updatePassword);
router.post('/update-profile-picture', protectTechnician, technicianController.updateProfilePicture);
router.post('/complete-profile', protectTechnician, technicianController.completeProfile);
 
module.exports = router;
   
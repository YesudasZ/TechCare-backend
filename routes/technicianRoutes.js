const express = require('express');
const technicianController = require('../controllers/technicianController');
const router = express.Router();

router.post('/signup', technicianController.signup);


module.exports = router;

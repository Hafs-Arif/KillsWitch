const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { auth } = require('../middleware/auth');

// Get all addresses for logged-in user
router.get('/', auth, addressController.getUserAddresses);

// Get specific address
router.get('/:id', auth, addressController.getAddress);

// Save or update address
router.post('/', auth, addressController.saveAddress);

// Delete address
router.delete('/:id', auth, addressController.deleteAddress);

module.exports = router;

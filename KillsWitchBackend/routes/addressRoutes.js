const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { auth } = require('../middleware/auth');

router.get('/', auth, addressController.getUserAddresses);
router.get('/:id', auth, addressController.getAddress);
router.post('/', auth, addressController.saveAddress);
router.delete('/:id', auth, addressController.deleteAddress);

module.exports = router;

const express = require('express');

const router = express.Router();
const { handleContactRequest } = require("../controllers/contactController");


router.post('/', handleContactRequest);
module.exports = router;

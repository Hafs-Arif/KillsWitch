const express = require('express');

const router = express.Router();
const { handleQuoteRequest } = require("../controllers/qouteController");


router.post('/', handleQuoteRequest);
module.exports = router;


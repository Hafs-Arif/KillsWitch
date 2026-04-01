const express = require('express');

const router = express.Router();
const { handleQuoteRequest } = require("../controllers/quoteController");


router.post('/', handleQuoteRequest);
module.exports = router;


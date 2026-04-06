const express = require('express');

const router = express.Router();
const { handleContactRequest } = require("../controllers/contantController");


router.post('/', handleContactRequest);
module.exports = router;

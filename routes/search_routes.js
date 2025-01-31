// routes/search.js
const express = require('express');
const { searchProducts } = require('../controller/search_controller');
const router = express.Router();


router.get('/product', searchProducts)

module.exports = router;
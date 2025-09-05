const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/searchController.js');

router.get('/search', listingsController.search); // search listings

module.exports = router;

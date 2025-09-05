const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /search?query=...
router.get('/', searchController.searchListings);

module.exports = router;

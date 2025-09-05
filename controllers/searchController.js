const Listing = require('../models/listing');

module.exports.searchListings = async (req, res) => {
  try {
    const query = req.query.query || '';
    if(!query) return res.json([]);

    // Search in title, location, country (case-insensitive)
    const regex = new RegExp(query, 'i'); 
    const listings = await Listing.find({
      $or: [
        { title: regex },
        { location: regex },
        { country: regex }
      ]
    });

    res.json(listings); // return JSON for navbar.js
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

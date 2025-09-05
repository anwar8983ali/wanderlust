const Listing = require('../models/listing');

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render('allListings', { allListings, currUser: req.user });
};

module.exports.search = async (req, res) => {
  const { query } = req.query;

  if(!query) return res.json([]); // empty query returns empty array

  // Case-insensitive search on title, description, location, country
  const listings = await Listing.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { location: { $regex: query, $options: 'i' } },
      { country: { $regex: query, $options: 'i' } }
    ]
  });

  res.json(listings);
};

const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");

// autocomplete suggestions (returns JSON)
router.get("/search-suggestions", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    // Use regex search (fast enough for small datasets). For better ranking, use $text.
    const regex = new RegExp(q, "i");
    const results = await Listing.find(
      { $or: [{ title: regex }, { location: regex }] },
      { title: 1, location: 1, images: 1 } // only return needed fields
    )
      .limit(7)
      .lean();

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

module.exports = router;

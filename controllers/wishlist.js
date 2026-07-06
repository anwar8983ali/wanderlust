const User = require("../models/user");
const Listing = require("../models/listing");

// Add or remove a listing from the logged-in user's favorites
module.exports.toggleFavorite = async (req, res) => {
  const { id } = req.params; // listing id
  const user = await User.findById(req.user._id);

  const alreadyFavorited = user.favorites.some(favId => favId.equals(id));

  if (alreadyFavorited) {
    user.favorites.pull(id);
  } else {
    user.favorites.push(id);
  }

  await user.save();

  // If the request came from a fetch() call, respond with JSON
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    return res.json({ favorited: !alreadyFavorited });
  }

  // Fallback for non-JS form submission
  res.redirect("back");
};

// Show all listings the user has favorited
module.exports.showWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate("favorites");
  res.render("wishlist/index.ejs", { listings: user.favorites });
};

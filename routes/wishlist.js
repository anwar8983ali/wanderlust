const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const wishlistController = require("../controllers/wishlist.js");

router.post("/listings/:id/favorite", isLoggedIn, wrapAsync(wishlistController.toggleFavorite));
router.get("/wishlist", isLoggedIn, wrapAsync(wishlistController.showWishlist));

module.exports = router;

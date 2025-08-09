const express = require("express");
const wrapAsync = require("../utils/wrapAsync.js");
const {listingSchema, reviewSchema} = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const multer  = require('multer')
const {storage}=require("../cloudConfig.js");
const upload = multer({ storage});


const {isLoggedIn, validateListing, isOwner} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

const router = express.Router({mergeParams: true});

// Index and Create routes using route()
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn,upload.single('image'), validateListing, wrapAsync(listingController.createListing));

// New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Show, Update, Delete routes using route()
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner,upload.single('image'), validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListing));

module.exports = router;


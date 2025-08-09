const express=require("express");
const wrapAsync=require("../utils/wrapAsync.js");
const {listingSchema,reviewSchema}=require("../schema.js");
const ExpressError=require("../utils/ExpressError.js");
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const router=express.Router({mergeParams:true});
const {isLoggedIn,isReviewAuther}=require("../middleware.js");

const {validateReview} =require("../middleware.js");

const reviewController=require("../controllers/reviews.js");

//post review
router.post("/",validateReview,isLoggedIn,wrapAsync(reviewController.createReview));

//delete review rout

router.delete("/:reviewId",isLoggedIn,isReviewAuther,wrapAsync(reviewController.destroyReview));


module.exports=router;
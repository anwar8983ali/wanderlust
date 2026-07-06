const Listing=require("../models/listing");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Converts "location, country" text into map coordinates — free, no key needed
async function geocodeLocation(location, country) {
  try {
    const query = `${location}, ${country}`;
    console.log("🔍 Geocoding query:", query);

    const response = await axios.get("https://us1.locationiq.com/v1/search", {
      params: {
        key: process.env.LOCATIONIQ_KEY,
        q: query,
        format: "json",
        limit: 1
      }
    });

    console.log("📍 LocationIQ response:", JSON.stringify(response.data));

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return [parseFloat(lon), parseFloat(lat)];
    }
    console.log("⚠️ No results found for:", query);
    return null;
  } catch (err) {
    console.log("❌ Geocoding error:", err.message);
    return null;
  }
}

// Uses Gemini to summarize overall guest sentiment from review comments
async function generateReviewSummary(reviews) {
  try {
    const comments = reviews.map(r => `- (${r.rating}★) ${r.comment}`).join("\n");
    const prompt = `Here are guest reviews for a vacation rental listing:\n\n${comments}\n\nWrite a short 1-2 sentence summary of the overall guest sentiment. Mention common praises and any recurring complaints, if present. Be neutral and factual, no marketing language.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.log("Review summary generation error:", err.message);
    return "";
  }
}

module.exports.index = async (req, res) => {
  const { category } = req.query;

  // Specific category selected -> plain filter with rating info attached
  if (category && category !== "Trending") {
    const allListings = await Listing.find({ category }).populate("reviews");
    allListings.forEach(listing => {
      if (listing.reviews.length > 0) {
        const sum = listing.reviews.reduce((acc, r) => acc + r.rating, 0);
        listing.avgRating = (sum / listing.reviews.length).toFixed(1);
      }
    });
    return res.render("listing/index.ejs", { allListings, activeCategory: category });
  }

  // "Trending" (or no filter) -> rank by real popularity signals
  const allListings = await Listing.aggregate([
    {
      $lookup: {
        from: "bookings",
        localField: "_id",
        foreignField: "listing",
        as: "bookingData"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "favorites",
        as: "favoritedBy"
      }
    },
    {
      $lookup: {
        from: "reviews",
        localField: "reviews",
        foreignField: "_id",
        as: "reviewData"
      }
    },
    {
      $addFields: {
        bookingCount: { $size: "$bookingData" },
        reviewCount: { $size: { $ifNull: ["$reviews", []] } },
        favoriteCount: { $size: "$favoritedBy" },
        avgRating: {
          $cond: [
            { $gt: [{ $size: "$reviewData" }, 0] },
            { $round: [{ $avg: "$reviewData.rating" }, 1] },
            null
          ]
        }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ["$bookingCount", 3] },
            { $multiply: ["$reviewCount", 2] },
            "$favoriteCount"
          ]
        }
      }
    },
    { $sort: { trendingScore: -1, createdAt: -1 } }
  ]);

  res.render("listing/index.ejs", { allListings, activeCategory: null });
};

module.exports.renderNewForm=(req, res) => {
  res.render("listing/new.ejs");
}

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({path:"reviews",populate:{path:"auther"}}).populate("owner");
  if(!listing){
    req.flash("error","Listing you requested does not exist");
    return res.redirect("/listings");
  }

  const totalReviews = listing.reviews.length;
  const avgRating = totalReviews > 0
    ? (listing.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : null;

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  listing.reviews.forEach(r => {
    if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++;
  });
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratingCounts[star],
    percent: totalReviews > 0 ? Math.round((ratingCounts[star] / totalReviews) * 100) : 0
  }));

  // Only regenerate the AI summary if the review count has changed since last time
  if (totalReviews >= 2 && listing.reviewSummaryCount !== totalReviews) {
    const summary = await generateReviewSummary(listing.reviews);
    listing.reviewSummary = summary;
    listing.reviewSummaryCount = totalReviews;
    await listing.save();
  }

  res.render("listing/show.ejs", { listing, avgRating, totalReviews, ratingBreakdown });
};

module.exports.createListing=async (req, res, next) => {
    let url=req.file.path;
    let filename=req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner=req.user._id;
    newListing.image={url,filename};

    const coordinates = await geocodeLocation(req.body.listing.location, req.body.listing.country);
    if (coordinates) {
      newListing.geometry = { type: "Point", coordinates };
    }

    await newListing.save();
    req.flash("success","New listing created");
    res.redirect("/listings");
};

module.exports.editListing=async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing){
    req.flash("error","Listing you requested does not exist");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listing/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing=async (req, res) => {
  let { id } = req.params;
  let listingData = { ...req.body.listing };

  const coordinates = await geocodeLocation(listingData.location, listingData.country);
  if (coordinates) {
    listingData.geometry = { type: "Point", coordinates };
  }

  let listing = await Listing.findByIdAndUpdate(id, listingData);
  if(typeof req.file!="undefined"){
    let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
  }
  req.flash("success","Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing=async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success","listing deleted");
  res.redirect("/listings");
};

module.exports.nearMe = async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    req.flash("error", "Location access is needed for this feature");
    return res.redirect("/listings");
  }

  const geoNearStage = {
    near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
    distanceField: "distance",
    spherical: true,
    query: { "geometry.coordinates": { $ne: [0, 0] } }
  };

  if (radius) {
    geoNearStage.maxDistance = parseFloat(radius) * 1000;
  }

  const listings = await Listing.aggregate([{ $geoNear: geoNearStage }]);

  listings.forEach(listing => {
    listing.distanceKm = (listing.distance / 1000).toFixed(1);
  });

  res.render("listing/index.ejs", { allListings: listings, isNearMe: true, radius: radius || null });
};

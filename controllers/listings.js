const Listing=require("../models/listing");
const axios = require("axios");

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

module.exports.index = async (req, res) => {
  const { category } = req.query;

  // Specific category selected -> plain filter, no trending logic needed
  if (category && category !== "Trending") {
    const allListings = await Listing.find({ category });
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
      $addFields: {
        bookingCount: { $size: "$bookingData" },
        reviewCount: { $size: { $ifNull: ["$reviews", []] } },
        favoriteCount: { $size: "$favoritedBy" }
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

module.exports.showListing=async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({path:"reviews",populate:{path:"auther"}}).populate("owner");
  if(!listing){
    req.flash("error","Listing you requested does not exist");
    res.redirect("/listings");
  }
  res.render("listing/show.ejs", { listing });
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
    res.redirect("/listings");
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
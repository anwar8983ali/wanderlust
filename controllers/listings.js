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

module.exports.index=async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listing/index.ejs", { allListings });
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

const Listing=require("../models/listing");


module.exports.index = async (req, res) => {
  const { q } = req.query; // Get the search query from URL
  let allListings;

  if (q && q.trim() !== "") {
    // Search by title (case-insensitive)
    allListings = await Listing.find({
      title: { $regex: q, $options: "i" }
    });
  } else {
    allListings = await Listing.find({});
  }

  res.render("listing/index.ejs", { allListings, searchQuery: q || "" });
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
  res.render("listing/show.ejs", { listing ,mapToken: process.env.MAP_TOKEN});
};

module.exports.createListing=async (req, res, next) => {
    // Create from the nested 'listing' property
    let url=req.file.path;
    let filename=req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner=req.user._id;
    newListing.image={url,filename};
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
  let listing=await Listing.findByIdAndUpdate(id, { ...req.body.listing });


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
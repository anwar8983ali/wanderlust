const Listing = require("../models/listing");
const User = require("../models/user");
const Review = require("../models/review");
const Booking = require("../models/booking");

module.exports.dashboard = async (req, res) => {
  const totalListings = await Listing.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalReviews = await Review.countDocuments();

  const topListings = await Listing.aggregate([
    { $addFields: { reviewCount: { $size: { $ifNull: ["$reviews", []] } } } },
    { $sort: { reviewCount: -1 } },
    { $limit: 5 },
    { $project: { title: 1, reviewCount: 1, price: 1 } }
  ]);

  const recentUsers = await User.find().sort({ _id: -1 }).limit(5);

  const recentBookings = await Booking.find()
    .populate("listing", "title")
    .populate("user", "username")
    .sort({ createdAt: -1 })
    .limit(5);

  res.render("admin/dashboard.ejs", {
    totalListings, totalUsers, totalBookings, totalReviews,
    topListings, recentUsers, recentBookings
  });
};

module.exports.allListings = async (req, res) => {
  const listings = await Listing.find().populate("owner", "username");
  res.render("admin/listings.ejs", { listings });
};

module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing removed by admin");
  res.redirect("/admin/listings");
};

module.exports.allUsers = async (req, res) => {
  const users = await User.find();
  res.render("admin/users.ejs", { users });
};

module.exports.toggleAdmin = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/admin/users");
  }
  user.role = user.role === "admin" ? "user" : "admin";
  await user.save();
  req.flash("success", `${user.username} is now ${user.role}`);
  res.redirect("/admin/users");
};

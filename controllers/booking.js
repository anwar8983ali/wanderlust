const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut, spotsBooked } = req.body;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const requestedSpots = parseInt(spotsBooked) || 1;

  if (checkInDate >= checkOutDate) {
    req.flash("error", "Check-out date must be after check-in date");
    return res.redirect(`/listings/${id}`);
  }

  if (requestedSpots > listing.totalSpots) {
    req.flash("error", `Only ${listing.totalSpots} spot(s) available for this listing`);
    return res.redirect(`/listings/${id}`);
  }

  const now = new Date();

  // Only bookings that haven't already checked out count as "occupying" a date
  const overlappingBookings = await Booking.find({
    listing: id,
    status: "confirmed",
    checkOut: { $gt: now },              // ignore past/completed bookings
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate }
  });

  const spotsAlreadyBooked = overlappingBookings.reduce((sum, b) => sum + (b.spotsBooked || 1), 0);
  const spotsRemaining = listing.totalSpots - spotsAlreadyBooked;

  if (requestedSpots > spotsRemaining) {
    req.flash("error", `Only ${spotsRemaining} spot(s) left for these dates`);
    return res.redirect(`/listings/${id}`);
  }

  const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const totalPrice = totalNights * listing.price * requestedSpots;

  const newBooking = new Booking({
    listing: id,
    user: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    totalNights,
    spotsBooked: requestedSpots,
    totalPrice
  });

  await newBooking.save();
  req.flash("success", "Booking confirmed!");
  res.redirect("/bookings/my-trips");
};

module.exports.myTrips = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("listing")
    .sort({ checkIn: 1 });

  const now = new Date();
  const bookingsWithComputedStatus = bookings.map(b => {
    const obj = b.toObject();
    if (b.status === "confirmed" && b.checkOut < now) {
      obj.displayStatus = "completed";
    } else {
      obj.displayStatus = b.status;
    }
    return obj;
  });

  res.render("bookings/myTrips.ejs", { bookings: bookingsWithComputedStatus });
};

module.exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  if (!booking || !booking.user.equals(req.user._id)) {
    req.flash("error", "You can't cancel this booking");
    return res.redirect("/bookings/my-trips");
  }
  booking.status = "cancelled";
  await booking.save();
  req.flash("success", "Booking cancelled");
  res.redirect("/bookings/my-trips");
};

module.exports.getBookedDates = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  const now = new Date();

  // Only future/current bookings block the calendar — past ones free up automatically
  const bookings = await Booking.find({
    listing: id,
    status: "confirmed",
    checkOut: { $gt: now }
  });

  const ranges = bookings.map(b => ({
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    spotsBooked: b.spotsBooked || 1
  }));

  res.json({ totalSpots: listing.totalSpots, bookings: ranges });
};
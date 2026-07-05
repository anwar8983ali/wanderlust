const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.post("/listings/:id/book", isLoggedIn, wrapAsync(bookingController.createBooking));
router.get("/listings/:id/booked-dates", wrapAsync(bookingController.getBookedDates));
router.get("/bookings/my-trips", isLoggedIn, wrapAsync(bookingController.myTrips));
router.post("/bookings/:bookingId/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;

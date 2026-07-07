const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isAdmin } = require("../middleware.js");
const adminController = require("../controllers/admin.js");

router.get("/admin", isLoggedIn, isAdmin, wrapAsync(adminController.dashboard));
router.get("/admin/listings", isLoggedIn, isAdmin, wrapAsync(adminController.allListings));
router.post("/admin/listings/:id/delete", isLoggedIn, isAdmin, wrapAsync(adminController.deleteListing));
router.get("/admin/users", isLoggedIn, isAdmin, wrapAsync(adminController.allUsers));
router.post("/admin/users/:id/toggle-admin", isLoggedIn, isAdmin, wrapAsync(adminController.toggleAdmin));

module.exports = router;

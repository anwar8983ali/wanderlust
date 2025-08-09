const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { savedRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

// Signup routes
router.route("/signup")
    .get(userController.signup)
    .post(wrapAsync(userController.pageSignup));

// Login routes
router.route("/login")
    .get(userController.renderLogin)
    .post(
        savedRedirectUrl,
        passport.authenticate('local', { 
            failureRedirect: '/login',
            failureFlash: true 
        }),
        userController.login
    );

// Logout route (kept separate as it doesn't share path with others)
router.get("/logout", userController.logout);

module.exports = router;

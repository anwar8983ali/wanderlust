if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
require("dotenv").config();
const axios = require("axios");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const bookingRouter = require("./routes/booking.js");
const wishlistRouter = require("./routes/wishlist.js");
const nodemailer = require("nodemailer");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const searchRoutes = require("./routes/search");
app.use("/search", searchRoutes);

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dburl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dburl);
}

app.get("/api/autocomplete", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.length < 2) return res.json([]);

    const response = await axios.get(
      "https://api.locationiq.com/v1/autocomplete",
      {
        params: {
          key: process.env.LOCATIONIQ_KEY,
          q: query,
          limit: 5,
          format: "json",
        },
      },
    );

    res.json(response.data);
  } catch (err) {
    console.log("Autocomplete error:", err.message);
    res.json([]);
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
  res.redirect("/listings");
});

const store = MongoStore.create({
  mongoUrl: dburl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("error in mongo store", error);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

//trasporter for otp
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.get("/demouser", async (req, res, next) => {
  let fakeUser = new User({
    email: "student@gmail.com",
    username: "delta-student",
  });

  let registeredUser = await User.register(fakeUser, "helloworld");
  res.send(registeredUser);
});

//forget password
app.get("/forgot-password", (req, res) => {
  res.render("user/forgotPassword");
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    req.flash("error", "Email not registered");
    return res.redirect("/forgot-password");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  user.resetOTP = otp.toString();

  user.otpExpiry = Date.now() + 5 * 60 * 1000;

  await user.save();

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject: "Wanderlust Password Reset OTP",
    html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.username},</p>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
    `,
  });

  console.log("OTP:", otp);
  console.log("OTP:",user.email);

  res.redirect("/verify-otp");
});

app.get("/verify-otp",(req,res)=>{
    res.render("user/verifyOTP");
});

app.post("/verify-otp", async (req, res) => {

    const { email, otp } = req.body;

    const user = await User.findOne({ email });

     console.log("Verify OTP route called");

    if (!user) {
        req.flash("error","User not found");
        return res.redirect("/verify-otp");
    }

    if (user.resetOTP !== otp) {
        req.flash("error","Invalid OTP");
        return res.redirect("/verify-otp");
    }

    if (user.otpExpiry < Date.now()) {
        req.flash("error","OTP Expired");
        return res.redirect("/forgot-password");
    }

    res.redirect(`/reset-password?email=${email}`);
});

app.get("/reset-password",(req,res)=>{

    const {email}=req.query;

    res.render("user/resetPassword",{email});

});

app.post("/reset-password",async(req,res)=>{

    const {email,password}=req.body;

    const user=await User.findOne({email});

    if(!user){
        req.flash("error","User not found");
        return res.redirect("/forgot-password");
    }

    await user.setPassword(password);

    user.resetOTP=undefined;
    user.otpExpiry=undefined;

    await user.save();

    req.flash("success","Password changed successfully.");

    res.redirect("/login");

});

app.use("/listings", listingRouter);
app.use("/", wishlistRouter);
app.use("/", bookingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
const Listing = require("./models/listing"); // your MongoDB model

//search

app.get("/search", async (req, res) => {
  const query = req.query.q?.trim(); // trim extra spaces

  // If query is empty or only spaces → no results
  if (!query) {
    return res.render("search/searchResults", { listings: [], query });
  }

  // Search by title OR location (case-insensitive)
  const listings = await Listing.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } },
      { country: { $regex: query, $options: "i" } },
    ],
  });

  // Render only matching listings
  res.render("search/searchResults", { listings, query });
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/chatbot", async (req, res) => {
  try {
    const userMessage = req.body.message;

    // Use fast Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(userMessage);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    res.json({ reply: "⚠️ Gemini is taking too long or failed." });
  }
});

// 404 Route - Fixed version
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

// Error handler
app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;
  res.status(status).render("error.ejs", { err });
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});

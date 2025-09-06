if(process.env.NODE_ENV!="production"){
  require('dotenv').config()
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const session=require('express-session');
const MongoStore = require('connect-mongo');
const flash=require('connect-flash');
const passport=require('passport');
const LocalStrategy=require('passport-local');
const User=require("./models/user.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");
const searchRoutes = require('./routes/search');
app.use('/search', searchRoutes);
const axios = require("axios");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dburl=process.env.ATLASDB_URL;

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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);

app.use(express.static(path.join(__dirname,"/public")));

// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });

const store=MongoStore.create({
  mongoUrl:dburl,
  crypto: {
    secret:process.env.SECRET
  },
  touchAfter:24*3600,
});

store.on("error",()=>{
  console.log("error in mongo store",error);
})

const sessionOptions={
  store,
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,
  }
}



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
   res.locals.success=req.flash("success");
   res.locals.error=req.flash("error");
   res.locals.currUser=req.user;
   next();
})


app.get("/demouser",async(req,res,next)=>{
  let fakeUser=new User({
    email:"student@gmail.com",
    username:"delta-student",
  });


 let registeredUser=await User.register(fakeUser,"helloworld");
  res.send(registeredUser);
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);
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
      { country: { $regex: query, $options: "i" } } 
    ],
  });

  // Render only matching listings
  res.render("search/searchResults", { listings, query });
});


//chatbot

app.post("/chatbot", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
      { inputs: message },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
      }
    );

    console.log("HuggingFace Response:", response.data); // 👈 log whole response

    const botReply =
      Array.isArray(response.data) && response.data[0]?.generated_text
        ? response.data[0].generated_text
        : response.data.generated_text || "Sorry, I couldn't understand that.";

    res.json({ reply: botReply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Something went wrong!" });
  }
});







// 404 Route - Fixed version
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

// Error handler
app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;
  res.status(status).render("error.ejs",{err});
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});

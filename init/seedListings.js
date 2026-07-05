if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}
const mongoose = require("mongoose");
const axios = require("axios");
const Listing = require("../models/listing");
const User = require("../models/user");

const dburl = process.env.ATLASDB_URL;

// Free geocoding via LocationIQ
async function geocodeLocation(location, country) {
  try {
    const query = `${location}, ${country}`;
    const response = await axios.get("https://us1.locationiq.com/v1/search", {
      params: {
        key: process.env.LOCATIONIQ_KEY,
        q: query,
        format: "json",
        limit: 1
      }
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return [parseFloat(lon), parseFloat(lat)];
    }
    console.log(`⚠️ No geocode match for: ${query}`);
    return null;
  } catch (err) {
    console.log(`❌ Geocoding failed for ${location}, ${country}:`, err.message);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const sampleListings = [
  {
    title: "Cozy Cottage in Manali",
    description: "A peaceful wooden cottage nestled in the hills of Manali, perfect for a mountain getaway with bonfire nights and apple orchards nearby.",
    price: 3500,
    location: "Manali",
    country: "India",
    imageUrl: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8"
  },
  {
    title: "Beachfront Villa in Goa",
    description: "Wake up to ocean waves in this beautiful beachfront villa with a private pool, just steps away from Baga Beach.",
    price: 8000,
    location: "Goa",
    country: "India",
    imageUrl: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1"
  },
  {
    title: "Houseboat Stay in Alleppey",
    description: "Experience the backwaters of Kerala on a traditional houseboat with home-cooked meals and scenic sunset views.",
    price: 6000,
    location: "Alleppey",
    country: "India",
    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944"
  },
  {
    title: "Heritage Haveli in Jaipur",
    description: "Stay in a beautifully restored royal haveli with intricate architecture, right in the heart of the Pink City.",
    price: 5500,
    location: "Jaipur",
    country: "India",
    imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41"
  },
  {
    title: "Treehouse Retreat in Wayanad",
    description: "A unique treehouse experience surrounded by lush forests, spice plantations, and misty mountains.",
    price: 4200,
    location: "Wayanad",
    country: "India",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"
  },
  {
    title: "Modern Apartment in Bangkok",
    description: "A sleek city apartment close to street markets, nightlife, and the Chao Phraya river, ideal for urban explorers.",
    price: 4800,
    location: "Bangkok",
    country: "Thailand",
    imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365"
  },
  {
    title: "Alpine Chalet in Zurich",
    description: "A charming wooden chalet with mountain views, cozy fireplace, and easy access to hiking and skiing trails.",
    price: 12000,
    location: "Zurich",
    country: "Switzerland",
    imageUrl: "https://images.unsplash.com/photo-1518602164578-cd0074062767"
  },
  {
    title: "Desert Camp in Jaisalmer",
    description: "Spend a night under the stars in a luxury desert camp, complete with camel rides and traditional Rajasthani folk music.",
    price: 3800,
    location: "Jaisalmer",
    country: "India",
    imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da"
  },
  {
    title: "Riverside Cabin in Rishikesh",
    description: "A tranquil cabin by the Ganges, perfect for yoga retreats, river rafting, and peaceful mornings by the water.",
    price: 2800,
    location: "Rishikesh",
    country: "India",
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa"
  },
  {
    title: "Island Bungalow in Bali",
    description: "A tropical bungalow surrounded by rice paddies and palm trees, minutes away from Bali's best beaches and temples.",
    price: 7000,
    location: "Bali",
    country: "Indonesia",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4"
  }
];

async function seed() {
  await mongoose.connect(dburl);
  console.log("Connected to DB");

  // Find or create a demo user to own these listings
  let demoUser = await User.findOne({ username: "demo-host" });
  if (!demoUser) {
    const newUser = new User({
      email: "demo-host@example.com",
      username: "demo-host"
    });
    demoUser = await User.register(newUser, "demoPassword123");
    console.log("✅ Created demo user: demo-host");
  } else {
    console.log("ℹ️ Using existing demo user: demo-host");
  }

  for (const item of sampleListings) {
    const coordinates = await geocodeLocation(item.location, item.country);

    const listing = new Listing({
      title: item.title,
      description: item.description,
      price: item.price,
      location: item.location,
      country: item.country,
      image: {
        url: item.imageUrl,
        filename: "seed-image"
      },
      owner: demoUser._id
    });

    if (coordinates) {
      listing.geometry = { type: "Point", coordinates };
      console.log(`✅ ${item.title} → [${coordinates}]`);
    } else {
      console.log(`⚠️ ${item.title} added without coordinates`);
    }

    await listing.save();

    // Respect LocationIQ rate limits (free tier: 2 requests/sec)
    await sleep(600);
  }

  console.log("\n🎉 Done! 10 sample listings added.");
  mongoose.connection.close();
}

seed();

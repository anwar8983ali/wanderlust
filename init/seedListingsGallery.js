if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}
const mongoose = require("mongoose");
const axios = require("axios");
const Listing = require("../models/listing");
const User = require("../models/user");

const dburl = process.env.ATLASDB_URL;

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

// Each listing now has 4 photos: 1 cover + 3 gallery images
const sampleListings = [
  {
    title: "Cozy Cottage in Manali",
    description: "A peaceful wooden cottage nestled in the hills of Manali, perfect for a mountain getaway with bonfire nights and apple orchards nearby.",
    price: 3500,
    location: "Manali",
    country: "India",
    category: "Mountains",
    photos: [
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8",
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562",
      "https://images.unsplash.com/photo-1519821172141-b5d8342d4110",
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c"
    ]
  },
  {
    title: "Beachfront Villa in Goa",
    description: "Wake up to ocean waves in this beautiful beachfront villa with a private pool, just steps away from Baga Beach.",
    price: 8000,
    location: "Goa",
    country: "India",
    category: "Amazing pools",
    photos: [
      "https://images.unsplash.com/photo-1602002418082-a4443e081dd1",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"
    ]
  },
  {
    title: "Houseboat Stay in Alleppey",
    description: "Experience the backwaters of Kerala on a traditional houseboat with home-cooked meals and scenic sunset views.",
    price: 6000,
    location: "Alleppey",
    country: "India",
    category: "Boats",
    photos: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
      "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b",
      "https://images.unsplash.com/photo-1528127269322-539801943592"
    ]
  },
  {
    title: "Heritage Haveli in Jaipur",
    description: "Stay in a beautifully restored royal haveli with intricate architecture, right in the heart of the Pink City.",
    price: 5500,
    location: "Jaipur",
    country: "India",
    category: "Iconic cities",
    photos: [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41",
      "https://images.unsplash.com/photo-1477587458883-47145ed94245",
      "https://images.unsplash.com/photo-1548013146-72479768bada",
      "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e"
    ]
  },
  {
    title: "Treehouse Retreat in Wayanad",
    description: "A unique treehouse experience surrounded by lush forests, spice plantations, and misty mountains.",
    price: 4200,
    location: "Wayanad",
    country: "India",
    category: "Camping",
    photos: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
      "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1"
    ]
  },
  {
    title: "Modern Apartment in Bangkok",
    description: "A sleek city apartment close to street markets, nightlife, and the Chao Phraya river, ideal for urban explorers.",
    price: 4800,
    location: "Bangkok",
    country: "Thailand",
    category: "Rooms",
    photos: [
      "https://images.unsplash.com/photo-1508009603885-50cf7c579365",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
    ]
  },
  {
    title: "Alpine Chalet in Zurich",
    description: "A charming wooden chalet with mountain views, cozy fireplace, and easy access to hiking and skiing trails.",
    price: 12000,
    location: "Zurich",
    country: "Switzerland",
    category: "Arctic",
    photos: [
      "https://images.unsplash.com/photo-1518602164578-cd0074062767",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
      "https://images.unsplash.com/photo-1610375461369-d613b564f4c4",
      "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5"
    ]
  },
  {
    title: "Desert Camp in Jaisalmer",
    description: "Spend a night under the stars in a luxury desert camp, complete with camel rides and traditional Rajasthani folk music.",
    price: 3800,
    location: "Jaisalmer",
    country: "India",
    category: "Camping",
    photos: [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da",
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9",
      "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3",
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e"
    ]
  },
  {
    title: "Riverside Cabin in Rishikesh",
    description: "A tranquil cabin by the Ganges, perfect for yoga retreats, river rafting, and peaceful mornings by the water.",
    price: 2800,
    location: "Rishikesh",
    country: "India",
    category: "Farms",
    photos: [
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa",
      "https://images.unsplash.com/photo-1500534623283-312aade485b7",
      "https://images.unsplash.com/photo-1517824806704-9040b037703b",
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c"
    ]
  },
  {
    title: "Island Bungalow in Bali",
    description: "A tropical bungalow surrounded by rice paddies and palm trees, minutes away from Bali's best beaches and temples.",
    price: 7000,
    location: "Bali",
    country: "Indonesia",
    category: "Domes",
    photos: [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4",
      "https://images.unsplash.com/photo-1573790387438-4da905039392",
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6"
    ]
  }
];

async function seed() {
  await mongoose.connect(dburl);
  console.log("Connected to DB");

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

    const [coverUrl, ...galleryUrls] = item.photos;

    const listing = new Listing({
      title: item.title,
      description: item.description,
      price: item.price,
      location: item.location,
      country: item.country,
      category: item.category,
      totalSpots: Math.floor(Math.random() * 3) + 1, // random 1-3 for variety
      image: {
        url: coverUrl,
        filename: "seed-image-cover"
      },
      images: galleryUrls.map((url, i) => ({
        url,
        filename: `seed-image-gallery-${i}`
      })),
      owner: demoUser._id
    });

    if (coordinates) {
      listing.geometry = { type: "Point", coordinates };
      console.log(`✅ ${item.title} → [${coordinates}] (${item.photos.length} photos)`);
    } else {
      console.log(`⚠️ ${item.title} added without coordinates`);
    }

    await listing.save();
    await sleep(600);
  }

  console.log("\n🎉 Done! 10 sample listings added, each with 4 photos.");
  mongoose.connection.close();
}

seed();

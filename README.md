# Wanderlust 🏡

A full-featured Airbnb-style vacation rental platform built with Node.js, Express, MongoDB, and EJS — featuring live maps, AI-powered search and insights, and a complete booking system.

**Live demo:** [wanderlust-1-hsi8.onrender.com](https://wanderlust-1-hsi8.onrender.com)

---

## Features

### Listings
- Create, edit, and delete property listings with image uploads (Cloudinary)
- Category filters (Mountains, Beaches, Castles, Boats, and more) with clickable filter bar
- **Trending algorithm** — listings are ranked by a real popularity score combining bookings, reviews, and favorites
- Multi-spot availability — hosts can list multiple bookable spots per listing (e.g. multiple rooms/beds)

### Maps & Location
- Interactive maps on every listing page (Leaflet.js + OpenStreetMap — completely free, no API key required for maps)
- Automatic geocoding of listing addresses via LocationIQ
- Location autocomplete when creating or editing a listing, preventing typos and bad addresses
- **"Near me" search** — uses the browser's Geolocation API and MongoDB's geospatial `$geoNear` queries to show listings sorted by real distance, with an adjustable radius filter

### Bookings
- Full date-range booking system with a calendar picker (Flatpickr)
- Live price calculation based on nights × price × number of spots
- Smart availability — the calendar automatically disables only fully-booked dates, and past bookings free up automatically without any manual cleanup
- "My Trips" dashboard for guests to view and cancel their bookings

### Reviews & Ratings
- Star-rating reviews with a full breakdown (5★ to 1★ distribution bar chart)
- **AI-generated review summaries** — Google Gemini analyzes all reviews for a listing and generates a short, neutral summary of overall guest sentiment

### Wishlist
- Save/unsave listings with a heart icon, viewable on a dedicated wishlist page

### AI Assistant
- Built-in chatbot powered by Google Gemini for answering guest questions

### Accounts
- Secure authentication with Passport.js (sessions stored in MongoDB via connect-mongo)
- Flash messages for user feedback across the app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Templating | EJS (ejs-mate for layouts) |
| Auth | Passport.js (local strategy) |
| File Storage | Cloudinary |
| Maps | Leaflet.js + OpenStreetMap |
| Geocoding | LocationIQ |
| AI | Google Gemini |
| Deployment | Render |

---

## Getting Started

### Prerequisites
- Node.js installed
- A MongoDB Atlas account (free tier works)
- Free API keys: [Cloudinary](https://cloudinary.com), [LocationIQ](https://locationiq.com), [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

```bash
git clone https://github.com/anwar8983ali/wanderlust.git
cd wanderlust
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
ATLASDB_URL=your_mongodb_connection_string
SECRET=your_session_secret
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
LOCATIONIQ_KEY=your_locationiq_key
```

### Run locally

```bash
node app.js
```

Visit `http://localhost:8080`

---

## Project Structure

```
wanderlust/
├── controllers/     # Route logic (listings, bookings, reviews, wishlist, etc.)
├── models/          # Mongoose schemas (Listing, Booking, User, Review)
├── routes/          # Express route definitions
├── views/           # EJS templates
├── public/          # Static assets
├── utils/           # Error handling helpers
├── cloudConfig.js   # Cloudinary configuration
├── middleware.js    # Auth and validation middleware
├── schema.js        # Joi validation schemas
└── app.js           # App entry point
```

---

## Notable Implementation Details

- **Geospatial queries**: listings store coordinates as GeoJSON `Point` data with a `2dsphere` index, enabling fast proximity search at scale.
- **Availability logic**: booking overlap checks only consider bookings with a future check-out date, so past stays automatically stop blocking a listing's calendar with no scheduled cleanup job required.
- **Trending score**: computed via an aggregation pipeline that joins listings with their bookings and favoriting users, weighting `bookings × 3 + reviews × 2 + favorites × 1`.
- **Cached AI summaries**: review sentiment summaries are only regenerated when a listing's review count changes, avoiding unnecessary API calls on every page load.

---

## License

This project was built for educational purposes.

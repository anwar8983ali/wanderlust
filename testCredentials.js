// test-credentials.js
const cloudinary = require('cloudinary').v2;

// Replace these with your actual credentials
const config = {
  cloud_name: 'dw5obaxrz',
  api_key: '923349328968787', // Your API key
  api_secret: 'zSnH91fiT4v8-6ajXreFjhh3gSo' // Your API secret
};

cloudinary.config(config);

// Test the connection
cloudinary.api.ping()
  .then(result => console.log('Success! Connection verified:', result))
  .catch(err => console.error('Connection failed:', err.message));
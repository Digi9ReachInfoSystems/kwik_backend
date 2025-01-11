// config/firebase.js
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = require("../kwikgroceries-8a11e-firebase-adminsdk-ea59r-fa7965e1b8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

module.exports = admin;

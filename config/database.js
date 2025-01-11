const express = require("express");
const mongoose = require("mongoose");
const http = require("http").Server(express());
const checkApiKey = require("./checkapikey");

const MONGODB_URI =
  "mongodb+srv://arjunjpdev:Arjun!23@cluster0.rsz9u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
    });
    console.log("MongoDB connected successfully");

    // Set up the Express app
    const app = express();

    // Middleware to log requests
    app.use((req, res, next) => {
      console.log(`${req.method} request for '${req.url}'`);
      next();
    });

    // Middleware to parse JSON body data
    app.use(express.json());

    // Use the API key authentication middleware for the routes
    app.use("/product", checkApiKey);
    app.use("/brand", checkApiKey);
    app.use("/category", checkApiKey);
    app.use("/subcategory", checkApiKey);
    app.use("/warehouse", checkApiKey);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;

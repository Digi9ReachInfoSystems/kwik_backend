// controllers/authController.js
const { admin } = require("../config/firebase");
const User = require("../models/user_models");

// Verify Firebase ID Token
const verifyToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split(" ")[1]; // Expecting Bearer token
  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Add user data to the request
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Example route: Protected route
const protectedRoute = (req, res) => {
  res.json({ message: "Welcome to the protected route!", user: req.user });
};

// Create a new user
const createUser = async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    // Step 1: Create user in Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Step 2: Save user details in MongoDB
    const newUser = new User({
      UID: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    });

    await newUser.save(); // Save to MongoDB

    res.status(201).json({ message: "User created successfully", userRecord });
  } catch (error) {
    console.error("Error creating user:", error);

    res.status(500).json({
      error: "Error creating user",
      details: error.message,
    });
  }
};

// Create account with phone
const createAccountWithPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber, otp, idToken } = req.body;

    if (!phoneNumber || !otp || !idToken) {
      return res
        .status(400)
        .json({ message: "Phone number, OTP, and ID token are required." });
    }

    // Verify the ID token (sent from the client after OTP verification)
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    // Link the phone number to the user's account
    const user = await admin.auth().updateUser(decodedToken.uid, {
      phoneNumber,
    });

    return res.status(200).json({
      message: "Phone number linked successfully",
      user: {
        UID: user.uid,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to create account with phone number",
      error: error.message,
    });
  }
};

module.exports = {
  verifyToken,
  protectedRoute,
  createUser,
  createAccountWithPhoneNumber,
};

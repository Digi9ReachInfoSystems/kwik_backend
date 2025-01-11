// routes/authRoutes.js
const express = require("express");
const authcontroller = ({
  verifyToken,
  protectedRoute,
  createUser,
  createAccountWithPhoneNumber,
} = require("../controller/auth_Controller"));

const router = express.Router();

// Routesß
router.post("/create-user", authcontroller.createUser); // Public route to create a user
router.get(
  "/protected",
  authcontroller.verifyToken,
  authcontroller.protectedRoute
); // Protected route
router.post(
  "/createAccountWithPhoneNumber",
  authcontroller.createAccountWithPhoneNumber
);

module.exports = router;

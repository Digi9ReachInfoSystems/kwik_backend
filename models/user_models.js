const mongoose = require("mongoose");

// Import the CartProduct and Address models
const CartProduct = require("./cart_product_model");
const Address = require("./address_model");

const userSchema = new mongoose.Schema({
  phone: { type: String, required: false },
  displayName: { type: String, required: true },
  photo_url: { type: String, required: false }, // URL for photo
  UID: { type: String, required: true },
  Address: [{ type: Address, required: false }],
  selected_Address: { type: Address, required: false },
  cart_products: [{ type: CartProduct, required: false }],
  cart_added_date: { type: Date, required: false },
  saved_cart_products: [{ type: CartProduct, required: false }],
  is_deliveryboy: { type: Boolean, required: false },
  is_blocked: { type: Boolean, required: false, default: false },
  deliveryboy_aadhar: { type: String, required: false }, // URL for Aadhar image
  deliveryboy_aadhar_number: { type: String, required: false },
  deliveryboy_driving_licence: { type: String, required: false }, // URL for Driving License image
  deliveryboy_driving_licence_number: { type: String, required: false },
  deliveryboy_account: { type: String, required: false }, // URL for bank account details
  deliveryboy_account_number: { type: String, required: false },
  deliveryboy_account_ifsc: { type: String, required: false },
  deliveryboy_bike_number: { type: String, required: false },
  deliveryboy_bike_image: { type: String, required: false }, // URL for Bike image
  assigned_warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: false,
  },

  created_time: { type: Date, required: true, default: Date.now },
});

// Create and export the User model
module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const { validate } = require("./warehouse_stock_model");

// Define the Address schema
const addressSchema = new mongoose.Schema({
  Location: {
    lat: { type: Number, required: true }, // Latitude of the address
    lang: { type: Number, required: true }, // Longitude of the address
  },
  address_type: {
    type: String,
    enum: ["Home", "Work", "Hotel", "Other"],
    required: true,
  }, // Types of address (e.g., Home, Work, Hotel, Other)
  flat_no_name: {
    type: String,
    required: [true, "Flat number or name is required"],
    trim: true, // Trim spaces
    minlength: [3, "Brand description must be at least 3 characters long"], // Minimum length validation
    maxlength: [100, "Brand description must be less than 100 characters"], // Maximum length validation
  }, // Flat number or name of the address
  floor: {
    type: String,
    default: null
  }, // Floor number (optional)
  area: {
    type: String,
    required: [true, "Area of the address is required"],
    trim: true, // Trim spaces
    minlength: [3, "Brand description must be at least 3 characters long"], // Minimum length validation
    maxlength: [100, "Brand description must be less than 100 characters"], // Maximum length validation
  }, // Area of the address
  landmark: {
    type: String,
    default: null
  }, // Landmark (optional)
  phone_no: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true, // Trim spaces
    validate: {
      validator: function (value) {
        return /^\d{10}$/.test(value);
      },
      message: "Invalid phone number format",
    }
  }, // Phone number associated with the address
  pincode: {
    type: String,
    required: [true, "Pincode is required"],
    trim: true, // Trim spaces
    validate: {
      validator: function (value) {
        return /^\d{6}$/.test(value);
      },
      message: "Invalid pincode format",
    }
  }
});

// Create and export the Address model
module.exports = addressSchema;

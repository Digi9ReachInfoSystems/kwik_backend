const mongoose = require("mongoose");

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
  flat_no_name: { type: String, required: true }, // Flat number or name of the address
  floor: { type: String, default: null }, // Floor number (optional)
  area: { type: String, required: true }, // Area of the address
  landmark: { type: String, default: null }, // Landmark (optional)
  phone_no: { type: String, required: true }, // Phone number associated with the address
});

// Create and export the Address model
module.exports = addressSchema;

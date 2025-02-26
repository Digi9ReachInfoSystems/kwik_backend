const mongoose = require("mongoose");

// Define the User reference for deliveryboys
const userRefSchema = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
};

// Define the Warehouse schema
const warehouseSchema = new mongoose.Schema({
  UID: { type: String, required: true },
  warehouse_id: { type: String, required: true },
  warehouse_name: { type: String, required: true },
  warehouse_des: { type: String, required: true },
  warehouse_image: { type: String, required: true },
  warehouse_number: { type: String, required: true },
  picode: { type: [String], required: true }, // List of postal codes
  manager_name: { type: String, required: true },
  manager_number: { type: String, required: true },
  manager_email: { type: String, required: true },
  warehouse_email: { type: String, required: true },
  warehouse_password: { type: String, required: true },
  deliveryboys: [{ type: userRefSchema }], // List of document references to User model for delivery boys
  warehouse_location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  }, // Latitude and Longitude for warehouse location
  warehouse_address: { type: String, required: true },
  tum_tumdelivery_start_time: { type: Date },
  tumtumdelivery_end_time: { type: Date },
  created_time: { type: Date, required: true, default: Date.now },
});

// Create and export the Warehouse model
module.exports = mongoose.model("Warehouse", warehouseSchema);

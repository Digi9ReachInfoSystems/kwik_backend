const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  brand_id: { type: Number, required: true },
  brand_name: { type: String, required: true },
  color: { type: String, required: true },
  brand_image: { type: String, required: true },
  brand_des: { type: String, required: true },
  brand_url: { type: String, required: false }, // Optional for website URL
  created_time: { type: Date, required: true, default: Date.now },
});

// Create and export the Brand model
module.exports = mongoose.model("Brand", brandSchema);

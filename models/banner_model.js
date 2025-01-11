const mongoose = require("mongoose");

// Define the Banner schema
const bannerSchema = new mongoose.Schema({
    banner_id: { type: String, required: true },
    banner_image: { type: String, required: true },  // URL for the banner image
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },  // Reference to the Category model
    sub_category_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },  // Reference to the SubCategory model
    created_time: { type: Date, required: true, default: Date.now },  // Time when the banner was created
});

// Create and export the Banner model
module.exports = mongoose.model("Banner", bannerSchema);

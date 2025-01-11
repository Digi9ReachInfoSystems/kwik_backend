const mongoose = require("mongoose");
const variationSchema = require("./variation_model");
const reviewSchema = require("./review_model");
const productSchema = new mongoose.Schema({
  product_name: { type: String, required: true },
  product_des: { type: String, required: true },
  product_image: { type: String, required: true },
  Brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
  category_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  sub_category_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true,
  },
  variations: { type: [variationSchema], required: true },
  warehouse_ref: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Warehouse",
    required: true,
  },
  sku: { type: String, required: true },
  product_video: { type: String, required: true }, // URL for video/gif
  review: { type: [reviewSchema], required: false },
  draft: { type: Boolean, required: true },
  created_time: { type: Date, required: true, default: Date.now },
});

// Create and export the Product model
module.exports = mongoose.model("Product", productSchema);

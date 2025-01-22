const mongoose = require("mongoose");
const variationSchema = require("./variation_model");
const reviewSchema = require("./review_model");

// Product Schema
const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: [true, "Product name is required"],
    minlength: [3, "Product name must be at least 3 characters long"],
  },
  product_des: {
    type: String,
    required: [true, "Product description is required"],
    minlength: [10, "Product description must be at least 10 characters long"],
  },
  product_image: [
    {
      type: String,
      required: [true, "Product image is required"],
      validate: {
        validator: function (v) {
          return /^https?:\/\/.*\.(jpg|jpeg|png|gif)$/.test(v); // Ensure valid image URL
        },
        message: "Invalid image URL format",
      },
    },
  ],
  Brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: [true, "Brand is required"],
  },
  category_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category reference is required"],
  },
  sub_category_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: [true, "Sub-category reference is required"],
  },
  variations: {
    type: [variationSchema],
    required: [true, "Product variations are required"],
  },
  warehouse_ref: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse reference is required"],
    },
  ],
  sku: {
    type: String,
    required: [true, "SKU is required"],
    unique: true, // Ensure unique SKU
  },
  product_video: {
    type: String,
    required: [true, "Product video URL is required"],
    validate: {
      validator: function (v) {
        return /^https?:\/\/.*\.(mp4|avi|mov|webm)$/.test(v); // Validate video URL
      },
      message: "Invalid video URL format",
    },
  },
  review: {
    type: [reviewSchema],
    required: false, // Reviews are optional
  },
  draft: {
    type: Boolean,
    required: [true, "Draft status is required"],
  },
  zone: {
    type: String,
    required: [true, "Zone is required"],
  },
  rack: {
    type: String,
    required: [true, "Rack is required"],
  },
  created_time: {
    type: Date,
    required: [true, "Creation time is required"],
    default: Date.now,
  },
});

// Create and export the Product model
module.exports = mongoose.model("Product", productSchema);

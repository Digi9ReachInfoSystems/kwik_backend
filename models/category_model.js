const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  category_id: {
    type: String,
    required: [true, "Category ID is required"],
    trim: true, // Trim spaces
    unique: true, // Ensure uniqueness
  },
  color: {
    type: String,
    required: [true, "Color is required"],
    trim: true, // Trim spaces
  },
  category_name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true, // Trim spaces
    minlength: [3, "Category name must be at least 3 characters long"], // Minimum length validation
    maxlength: [100, "Category name must be less than 100 characters"], // Maximum length validation
  },
  category_des: {
    type: String,
    required: [true, "Category description is required"],
    trim: true, // Trim spaces
    minlength: [10, "Category description must be at least 10 characters long"], // Minimum length validation
  },
  category_image: {
    type: String,
    required: [true, "Category image URL is required"],
    validate: {
      validator: function (v) {
        // Basic URL format validation
        return /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/.test(v);
      },
      message: "Invalid URL format for category image",
    },
  },
  created_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Create and export the Category model
module.exports = mongoose.model("Category", categorySchema);

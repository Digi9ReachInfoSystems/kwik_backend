const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  
  brand_name: {
    type: String,
    required: [true, "Brand name is required"],
    trim: true, // Trim spaces
    minlength: [3, "Brand name must be at least 3 characters long"], // Minimum length validation
    maxlength: [100, "Brand name must be less than 100 characters"], // Maximum length validation
  },
  color: {
    type: String,
    required: [true, "Color is required"],
    trim: true, // Trim spaces
    validate: {
      validator: function (v) {
        // Regex to validate hex color code (either 3 or 6 characters after #)
        return /^#([0-9A-Fa-f]{3}){1,2}$/.test(v);
      },
      message: "Invalid color format. It must be a valid hexadecimal color code.",
    },
  },
  brand_image: {
    type: String,
    required: [true, "Brand image URL is required"],
    validate: {
      validator: function (v) {
        // Regex to validate image URL
        return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
      },
      message: "Invalid image URL format",
    },
  },
  brand_des: {
    type: String,
    required: [true, "Brand description is required"],
    trim: true, // Trim spaces
    minlength: [3, "Brand description must be at least 3 characters long"], // Minimum length validation
    maxlength: [100, "Brand description must be less than 100 characters"], // Maximum length validation
  },
  brand_url: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        // Regex to validate image URL
        return /^(ftp|http|https):\/\/[^ "]+$/.test(v);
      },
      message: "Invalid brand URL format",
    },
  }, // Optional for website URL
  created_time: { type: Date, required: true, default: Date.now },
});

// Create and export the Brand model
module.exports = mongoose.model("Brand", brandSchema);

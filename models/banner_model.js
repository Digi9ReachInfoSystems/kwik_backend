const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the Banner schema
const bannerSchema = new mongoose.Schema({
  banner_id: {
    type: Number,
    required: [true, "Banner ID is required"],
    enum: [1, 2, 3, 4],
  },

  banner_image: {
    type: String,
    required: [true, "Banner image URL is required"],
    validate: {
      validator: (v) =>
        /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|svg))$/i.test(v), // Ensure it's a valid image URL (basic regex)
      message: "Please provide a valid image URL",
    },
  }, // URL for the banner image

  category_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category reference is required"],
    validate: {
      // Ensure the category reference exists in the Category collection
      validator: async (v) => {
        const categoryExists = await mongoose
          .model("Category")
          .exists({ _id: v });
        return categoryExists;
      },
      message: "Invalid category reference",
    },
  }, // Reference to the Category model

  sub_category_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: false,
  }, // Reference to the SubCategory model
  order_id: {
    type: Number,
    required: true,
    default: 1,
  },
  created_time: {
    type: Date,
    required: [true, "Creation time is required"],
    default: Date.now,
    validate: {
      validator: (v) => v instanceof Date && !isNaN(v.getTime()), // Ensure valid date format
      message: "Invalid creation time",
    },
  }, // Time when the banner was created
});

// Create and export the Banner model
module.exports = mongoose.model("Banner", bannerSchema);

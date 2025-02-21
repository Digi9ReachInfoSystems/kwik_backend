const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  sub_category_id: {
    type: String,
    required: [true, "Sub-category ID is required"],
    unique: true, // Ensure uniqueness of the sub-category ID
  },
  category_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category reference is required"],
    validate: {
      validator: async function (value) {
        const categoryExists = await mongoose.model("Category").findById(value);
        return !!categoryExists; // Validate category exists
      },
      message:
        "Invalid category reference. The referenced category does not exist.",
    },
  },
  sub_category_name: {
    type: String,
    required: [true, "Sub-category name is required"],
    minlength: [3, "Sub-category name must be at least 3 characters long"],
  },
  sub_category_des: {
    type: String,
    required: [true, "Sub-category description is required"],
    maxlength: [500, "Description cannot be longer than 500 characters"],
  },
  sub_category_image: {
    type: String,
    required: [true, "Sub-category image URL is required"],
    validate: {
      validator: function (value) {
        return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(value); // Basic URL validation
      },
      message: "Invalid image URL format.",
    },
  },
  sub_created_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    required: [true, "Is deleted status is required"],
    default: false,
  },
});

// Create and export the SubCategory model
module.exports = mongoose.model("SubCategory", subCategorySchema);

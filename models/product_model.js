const mongoose = require("mongoose");
const variationSchema = require("./variation_model");
const reviewSchema = require("./review_model");
const zoneRackSchema = require("./zoneRack_model");

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
          return /^(ftp|http|https):\/\/[^ "]+$/.test(v);// Ensure valid image URL
        },
        message: "Invalid image URL format",
      },
    },
  ],
  Brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
  },
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
  },
  sub_category_ref: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: [true, "Sub-category reference is required"],
    validate: {
      // Ensure the sub-category reference exists in the SubCategory collection
      validator: async (v) => {
        const subCategoryExists = await mongoose
          .model("SubCategory")
          .exists({ _id: v });
        return subCategoryExists;
      },
      message: "Invalid sub-category reference",
    },
  }],
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
    required: [false, "Product video URL is required"],
    validate: {
      validator: function (v) {
        if (v === "video") {
          return true;
        }
        return /^(ftp|http|https):\/\/[^ "]+$/.test(v);

      },
      message: "Invalid video URL format",
    },
  },
  review: {
    type: [reviewSchema],
    required: false,
  },
  draft: {
    type: Boolean,
    required: [true, "Draft status is required"],
  },

  created_time: {
    type: Date,
    required: [true, "Creation time is required"],
    default: Date.now,
  },
  sensible_product: {
    type: Boolean,
    required: [true, "Sensible product status is required"],
  },
  isDeleted: {
    type: Boolean,
    required: [true, "Is deleted status is required"],
    default: false,
  },
  qc_status: {
    type: String,
    required: true,
    enum: ["pending", "approved", "rejected", "revised"],
    message: "Invalid QC status",
    default: "pending"
  },
  last_qc_done_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  qc_remarks:[ {
    type: String,
    required: false,
  }],
});

// Create and export the Product model
module.exports = mongoose.model("Product", productSchema);

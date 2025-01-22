const mongoose = require("mongoose");

// Define the User reference schema for user_list
const userRefSchema = {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
};

// Define the Coupon schema
const couponSchema = new mongoose.Schema({
  coupon_name: {
    type: String,
    required: [true, "Coupon name is required"],
    trim: true,
  },

  coupon_des: {
    type: String,
    required: [true, "Coupon description is required"],
    trim: true,
  },

  start_date: {
    type: Date,
    required: [true, "Start date is required"],
    validate: {
      validator: function (value) {
        return value instanceof Date && !isNaN(value);
      },
      message: "Start date must be a valid date",
    },
  },

  end_date: {
    type: Date,
    required: [true, "End date is required"],
    validate: {
      validator: function (value) {
        return value instanceof Date && !isNaN(value);
      },
      message: "End date must be a valid date",
    },
  },

  min_order_value: {
    type: Number,
    required: [true, "Minimum order value is required"],
    min: [0, "Minimum order value must be greater than or equal to 0"],
  },

  discount_price: {
    type: Number,
    required: [true, "Discount price is required"],
    min: [0, "Discount price must be greater than or equal to 0"],
  },

  coupon_image: {
    type: String,
    required: [true, "Coupon image is required"],
    match: [
      /^https?:\/\/.*\.(?:png|jpg|jpeg|gif)$/,
      "Coupon image must be a valid URL (with image extension)",
    ],
  },

  coupon_type: {
    type: String,
    required: [true, "Coupon type is required"],
    enum: {
      values: ["All", "Selected users"],
      message: 'Coupon type must be either "All" or "Selected users"',
    },
  },

  user_list: {
    type: [userRefSchema],
    required: [true, "User list is required"],
    validate: {
      validator: async function (value) {
        if (value.length > 0) {
          const userExists = await mongoose
            .model("User")
            .exists({ _id: { $in: value } });
          return userExists;
        }
        return false;
      },
      message: "User list must contain valid user references",
    },
  },

  created_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Create and export the Coupon model
module.exports = mongoose.model("Coupon", couponSchema);

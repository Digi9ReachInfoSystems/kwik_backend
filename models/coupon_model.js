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

  discount_max_price: {
    type: Number,
    required: [true, "Discount price is required"],
    min: [0, "Discount price must be greater than or equal to 0"],
  },

  discount_percentage: {
    type: Number,
    required: [true, "Discount percentage is required"],
    min: [0, "Discount percentage must be greater than or equal to 0"],
    max: [100, "Discount percentage must be less than or equal to 100"],
  },

  coupon_image: {
    type: String,
    required: [true, "Coupon image is required"],
    validate: {
      validator: function (v) {
        return /^(ftp|http|https):\/\/[^ "]+$/.test(v);// Ensure valid image URL
      },
      message: "Coupon image must be a valid URL ",
    },
  },

  coupon_type: {
    type: String,
    required: [true, "Coupon type is required"],
    enum: {
      values: ["All", "Selected users", "new user", "normal", "individual"],
      message:
        'Coupon type must be either "All", "Selected users", "new user", "normal",  "individual"',
    },
  },

  user_list: {
    type: [userRefSchema],
    required: function () {
      if (this.coupon_type === "Selected users" || this.coupon_type === "individual") {
        return true
      } else {
        return false
      }
      // Only required for "Selected users" or "individual"
    },
    validate: {
      validator:
        async function (value) {
          if (this.coupon_type === "Selected users" || this.coupon_type === "individual") {
            if (value.length > 0) {
              const userExists = await mongoose
                .model("User")
                .exists({ _id: { $in: value } });
              return userExists;
            }
            return false;
          } else {
            return true;
          }
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

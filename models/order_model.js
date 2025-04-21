const mongoose = require("mongoose");
const User = require("../models/user_models"); // Import the User model

// Define the Address schema for user_address
const addressSchema = require("./address_model");

// Define the CartProduct schema for products
const cartProductSchema = require("./cart_product_model");

// Define the Order schema
const orderSchema = new mongoose.Schema({


  warehouse_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: [true, "Warehouse reference is required"],
    validate: {
      validator: async (v) => {
        const warehouseExists = await mongoose
          .model("Warehouse")
          .exists({ _id: v });
        return warehouseExists;
      },
      message: "Invalid warehouse reference",
    },
  }, // Reference to the Warehouse model

  user_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    validate: {
      validator: async (v) => {
        const userExists = await mongoose.model("User").exists({ _id: v });
        return userExists;
      },
      message: "Invalid user reference",
    },
  }, // Reference to the User model

  products: {
    type: [cartProductSchema],
    required: [true, "Products are required"],
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: "At least one product is required in the order",
    },
  }, // List of cart products

  delivery_boy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: [false, "Delivery boy reference is required"],
    validate: {
      validator: async (v) => {
        const deliveryBoyExists = await mongoose
          .model("User")
          .exists({ _id: v });
        return deliveryBoyExists;
      },
      message: "Invalid delivery boy reference",
    },
  }, // Reference to the User model (delivery boy)

  order_status: {
    type: String,
    required: [true, "Order status is required"],
    enum: ["Packing", "Out for delivery", "Delivered", "Delivery failed", "Order placed"],
  },

  user_address: {
    type: addressSchema,
    required: [true, "User address is required"],
    validate: {
      validator: (v) => v && typeof v === "object" && v !== null,
      message: "Invalid address data",
    },
  }, // User address schema

  user_contact_number: {
    type: String,
    required: [true, "User contact number is required"],
    match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
  },

  user_location: {
    lat: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    lang: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
  },

  otp: {
    type: String,
    required: [true, "OTP is required"],
  },

  order_placed_time: {
    type: Date,
    required: [true, "Order placed time is required"],
  },

  out_for_delivery_time: {
    type: Date,
    required: [false, "Out for delivery time is required"],
  },
  packing_time: {
    type: Date,
    required: [false, "Packing time is required"],
  },
  completed_time: {
    type: Date,
    validate: {
      validator: function (v) {
        // Ensure completed time is after out for delivery time
        if (v && this.out_for_delivery_time) {
          return v >= this.out_for_delivery_time;
        }
        return true;
      },
      message: "Completed time must be after out for delivery time",
    },
  },

  failed_time: {
    type: Date,
    validate: {
      validator: function (v) {
        // Ensure failed time is after out for delivery time
        if (v && this.out_for_delivery_time) {
          return v >= this.out_for_delivery_time;
        }
        return true;
      },
      message: "Failed time must be after out for delivery time",
    },
  },

  payment_type: {
    type: String,
    required: [true, "Payment type is required"],
    enum: ["COD", "Online payment"],
  },

  total_amount: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [0, "Total amount must be a positive number"],
  }, // Total MRP

  total_saved: {
    type: Number,
    required: [true, "Total saved amount is required"],
    min: [0, "Total saved amount must be a positive number"],
  }, // Total savings (MRP - selling price)

  discount_price: {
    type: Number,
    required: [true, "Discount price is required"],
    min: [0, "Discount price must be a positive number"],
  }, // Coupon discount

  profit: {
    type: Number,
    required: [true, "Profit is required"],
    min: [0, "Profit must be a positive number"],
  }, // Profit calculation (selling price - (buying price + discount))

  payment_id: {
    type: String,
    default: null,
  }, // Online payment ID (if applicable)

  type_of_delivery: {
    type: String,
    required: [true, "Type of delivery is required"],
    enum: ["tum tum", "instant"],
  },
  selected_time_slot: {
    type: Date,
    required: [false, "Time slot is required"],
  },

  delivery_charge: {
    type: Number,
    required: [true, "Delivery charge is required"],
    min: [0, "Delivery charge must be a positive number"],
  },
  handling_charge: {
    type: Number,
    required: false
  },
  high_demand_charge: {
    type: Number,
    required: false
  },
  delivery_instructions: {
    type: String,
    required: [false, "Delivery instructions are required"],
  },

  created_time: {
    type: Date,
    required: [true, "Creation time is required"],
    default: Date.now,
  },
});

// Create and export the Order model
module.exports = mongoose.model("Order", orderSchema);

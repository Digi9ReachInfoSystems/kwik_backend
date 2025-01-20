const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the WarehouseStock schema
const warehouseStockSchema = new mongoose.Schema({
  warehouse_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: [true, "Warehouse reference is required"],
    validate: {
      // Ensure the warehouse reference is valid by checking if it exists in the Warehouse collection
      validator: async (v) => {
        const warehouseExists = await mongoose
          .model("Warehouse")
          .exists({ _id: v });
        return warehouseExists;
      },
      message: "Invalid warehouse reference",
    },
  }, // Reference to the Warehouse model

  stock_qty: {
    type: Number,
    required: [true, "Stock quantity is required"],
    min: [0, "Stock quantity cannot be negative"], // Ensure stock quantity is a non-negative number
    validate: {
      validator: (v) => v > 0, // Ensure stock quantity is greater than zero
      message: "Stock quantity must be greater than zero",
    },
  }, // Quantity of the product in the warehouse

  instock: {
    type: Boolean,
    required: [true, "In-stock status is required"],
    default: true, // Default to true if not provided
  }, // Whether the product is in stock or not
});

// Create and export the WarehouseStock model
module.exports = mongoose.model("WarehouseStock", warehouseStockSchema);

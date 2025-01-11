const mongoose = require("mongoose");

// Define the WarehouseStock schema
const warehouseStockSchema = new mongoose.Schema({
    warehouse_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },  // Reference to the Warehouse model
    stock_qty: {
        type: Number,
        required: true
    },  // Quantity of the product in the warehouse
    instock: {
        type: Boolean,
        required: true,
        default: true
    },  // Whether the product is in stock or not
});

// Create and export the WarehouseStock model
module.exports = mongoose.model("WarehouseStock", warehouseStockSchema);

const mongoose = require("mongoose");

const variationSchema = new mongoose.Schema({
    Qty: { type: Number, required: true },  // Quantity in the specified unit
    unit: { type: String, required: true },  // Unit for the quantity (e.g., kg, mg, g, l, ml)
    MRP: { type: Number, required: true },  // Maximum Retail Price
    buying_price: { type: Number, required: true },  // Buying price of the product
    selling_price: { type: Number, required: true },  // Selling price of the product
    stock: [{
        warehouse_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },  // Reference to the Warehouse model
        stock_qty: { type: Number, required: true },  // Quantity of the product available in the warehouse
    }],
    created_time: { type: Date, required: true, default: Date.now },  // Timestamp for when the variation was created
});

module.exports = variationSchema;  // Export the schema, not the model

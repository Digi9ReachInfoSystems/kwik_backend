const mongoose = require("mongoose");


const stockSchema = new mongoose.Schema({

    warehouse_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },  // Reference to the Warehouse model
    stock_qty: { type: Number, required: true },  // Quantity of the product available in the warehouse
    visibility: { type: Boolean, required: true },
    zone: { type: String, required: true },
    rack: { type: String, required: true },
    isDeleted: { type: Boolean, required: true, default: false },
})

module.exports = stockSchema;
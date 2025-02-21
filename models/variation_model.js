const mongoose = require("mongoose");
const stockSchema = require("./stock_model");

const variationSchema = new mongoose.Schema({
  Qty: { type: Number, required: true },  // Quantity in the specified unit
  unit: { 
    type: String, 
    required: true, 
    enum: ['kg', 'mg', 'g', 'l', 'ml', 'number'],  // Enum for unit
    message: 'Unit must be one of the following: kg, mg, g, l, ml, number'  // Custom message
  }, 
  MRP: { type: Number, required: true },  // Maximum Retail Price
  buying_price: { type: Number, required: true },  // Buying price of the product
  selling_price: { type: Number, required: true },  // Selling price of the product
  stock: [stockSchema],
  Highlight:[{
   type:Map,
   required:false
  }],
  info:[{
    type:Map,
    required:false
  }],
  created_time: { type: Date, required: true, default: Date.now },  // Timestamp for when the variation was created
});

module.exports = variationSchema;  // Export the schema, not the model

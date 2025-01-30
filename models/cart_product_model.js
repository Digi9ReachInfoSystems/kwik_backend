const mongoose = require("mongoose");
const variationSchema = require("./variation_model");

const cartProductSchema = new mongoose.Schema({
  product_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variant: {
    type: variationSchema, // Use variation schema as an embedded document
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  selling_price: {
    type: Number,
    required: true,
  },
  mrp: {
    type: Number,
    required: true,
  },
  // price: {
  //   type: Number,
  //   required: true,
  // },
  //selling price
  // MRp
  // Buying price
  // total_price: {
  //   type: Number,
  //   required: true,
  // },
});

// Create and export the CartProduct model
module.exports = cartProductSchema;

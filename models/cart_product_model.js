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
  pincode: {
    type: String,
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
  buying_price: {
    type: Number,
    required: true,
  },
  inStock: {
    type: Boolean,
    required: true
  },
  variation_visibility: {
    type: Boolean,
    required: true
  },
  final_price: {
    type: Number,
    required: true,
  },
  cart_added_date: {
    type: Date,
    required: true,
  },//CART TIME -ACCORDING TO THIS WE HAVE TO NOTIFY USER AFTER 2 HOURS. rEDIRECT TO CART Page 

});

// Create and export the CartProduct model
module.exports = cartProductSchema;

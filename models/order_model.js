const mongoose = require("mongoose");
const User = require("./User"); // Import the User model

// Define the Address schema for user_address
const addressSchema = require("./address_model");

// Define the CartProduct schema for products
const cartProductSchema = require("./cart_product_model");



// Define the Order schema
const orderSchema = new mongoose.Schema({
    order_id: { type: String, required: true },
    warehouse_ref: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true
    },  // Reference to the Warehouse model
    user_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to the User model
    products: { type: [cartProductSchema], required: true },  // List of cart products
    delivery_boy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to the User model (delivery boy)
    order_status: {
        type: String,
        required: true,
        enum: ['packing', 'out_for_delivery', 'delivered', 'delivery_failed'],
    },
    user_address: { type: addressSchema, required: true },  // User address schema
    user_contact_number: { type: String, required: true },
    user_location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    otp: { type: String, required: true },
    order_placed_time: { type: Date, required: true },
    out_for_delivery_time: { type: Date, required: true },
    completed_time: { type: Date },
    failed_time: { type: Date },
    payment_type: {
        type: String,
        required: true,
        enum: ['COD', 'Online payment'],
    },
    total_amount: { type: Number, required: true },  // Total MRP
    total_saved: { type: Number, required: true },  // Total savings (MRP - selling price)
    discount_price: { type: Number, required: true },  // Coupon discount
    profit: { type: Number, required: true },  // Profit calculation (selling price - (buying price + discount))
    payment_id: { type: String },  // Online payment ID (if applicable)
    type_of_delivery: {
        type: String,
        required: true,
        enum: ['tum tum', 'instant'],
    },
    delivery_charge: { type: Number, required: true },
    created_time: { type: Date, required: true, default: Date.now },
});

// Create and export the Order model
module.exports = mongoose.model("Order", orderSchema);

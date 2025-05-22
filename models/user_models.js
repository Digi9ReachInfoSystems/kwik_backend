const mongoose = require("mongoose");
 
// Import the CartProduct and Address models
const CartProduct = require("./cart_product_model");
const Address = require("./address_model");
const SearchHistory = require("./searchHistory_model");
 
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  displayName: { type: String, required: true },
  photo_url: { type: String, required: false }, // URL for photo
  UID: { type: String, required: true },
  Address: [{ type: Address, required: false }],
  selected_Address: { type: Address, required: false },
  cart_products: [{ type: CartProduct, required: false }],
  cart_added_date: { type: Date, required: false },
  saved_cart_products: [{ type: CartProduct, required: false }],
  is_deliveryboy: { type: Boolean, required: true, default: false },
  is_blocked: { type: Boolean, required: false, default: false },
  deliveryboy_aadhar: [{ type: String, required: false }], // URL for Aadhar image
  deliveryboy_aadhar_number: { type: String, required: false },
  deliveryboy_driving_licence: [{ type: String, required: false }], // URL for Driving License image
  deliveryboy_driving_licence_number: { type: String, required: false },
  deliveryboy_account: [{ type: String, required: false }], // URL for bank account details
  deliveryboy_account_number: { type: String, required: false },
  deliveryboy_account_ifsc: { type: String, required: false },
  deliveryboy_bike_number: { type: String, required: false },
  deliveryboy_bike_image: [{ type: String, required: false }], // URL for Bike image
  deliveryboy_rc_number: { type: String, required: false },
  deliveryboy_rc_image: [{ type: String, required: false }], // URL for RC image
  deliveryboy_pan_number: { type: String, required: false },
  deliveryboy_pan_image: [{ type: String, required: false }], // URL for PAN image
  selected_warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: false },
  deliveryboy_application_status: {
    type: String,
    required: false,
    enum: ["pending", "approved", "rejected", "blocked"],
    default: "pending",
  },
  is_inhouse_deliveryboy: { type: Boolean, required: true, default: false },
  search_history: [{
    query: { type: String, required: false },
    timestamp: { type: Date, required: false },
  }],
  assigned_warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: false,
  },
  isWarehouse: { type: Boolean, required: true, default: false },
  isUser: { type: Boolean, required: true, default: false },
  fcm_token: { type: String, required: false },
  device_number: { type: String, required: false },
  is_qc: { type: Boolean, required: true, default: false },
  created_time: { type: Date, required: true, default: Date.now },
  current_pincode: { type: String, required: false },
  whishlist: [
    {
      product_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: false
      },
      variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
      },
    }
  ],
  vehicle_type: {
    type: String,
    required: false,
    enum: ["two_wheeler", "three_wheeler", "four_wheeler"],
    default: "two_wheeler",
  },
  assigned_orders:[
    {
      order_ref:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: false
      },
      assigned_time:{
        type: Date,
        required: false
      },
      status:{
        type: String,
        required: false,
        enum: ["assigned", "picked_up", "delivered"],
        default: "assigned",
      }
    }
  ],
  deliveryboy_day_availability_status: { type: Boolean, required: false, default: false },
  deliveryboy_order_availability_status: {
    tum_tum: { type: Boolean, required: false, default: true },
    instant:{
      status: { type: Boolean, required: false, default: true },
      last_assigned_at: { type: Date, required: false },
    },
 
  },
});
 
// Create and export the User model
module.exports = mongoose.model("User", userSchema);
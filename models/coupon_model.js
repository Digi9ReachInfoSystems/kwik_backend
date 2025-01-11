const mongoose = require("mongoose");


const userRefSchema = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
};
// Define the Coupon schema
const couponSchema = new mongoose.Schema({
    coupon_name: { type: String, required: true },
    coupon_des: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    min_order_value: { type: Number, required: true },
    discount_price: { type: Number, required: true },
    coupon_image: { type: String, required: true }, // URL for the coupon image
    coupon_type: { type: String, require: true, enum: ['All', 'Selected users'], },
    user_list: { type: [userRefSchema], required: true },
    created_time: { type: Date, required: true, default: Date.now }
});

// Create and export the Coupon model
module.exports = mongoose.model("Coupon", couponSchema);

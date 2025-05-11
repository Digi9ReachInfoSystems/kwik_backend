const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        status: {
            type: String,
            enum: ["created", "paid", "failed", "refunded"],
            default: "created",
        },
        payment_id: { type: String, unique: true, sparse: true },
        razorpay_order_id: { type: String, unique: true, sparse: true },
        razorpay_signature: { type: String },
        receipt: { type: String },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        cart_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cart",
            // required: true,
        },
        order_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        method: { type: String },
        acquirer_data: { type: Object },
        description: { type: String },
   
    },
    {
        timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
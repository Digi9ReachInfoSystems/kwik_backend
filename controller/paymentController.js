const mongoose = require("mongoose");
const Payment = require("../models/paymentModel");
const Order = require("../models/order_model");
const User = require("../models/user_models");
const razorpayInstance = require("../utils/razorpayService");
const crypto = require("crypto");
const {
  generateAndSendNotificationNew,
} = require("../controller/notificationController");
const Notification = require("../models/notifications_model");



exports.createRazorpayOrder = async (req, res) => {
    const { user_ref, amount, description, order_id, cart_id } = req.body;
    console.log("user_ref", user_ref);
    console.log("amount", amount);
    console.log("description", description);
    console.log("order_id", order_id);
    console.log("cart_id", cart_id);

    // Validate input
    if (!user_ref || !amount) {
        return res
            .status(400)
            .json({ error: "Missing required fields: user_ref, amount" });
    }

    try {
        // Check if student exists
        const user = await User.findOne({ UID: user_ref });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if order exists
        const userOrder = await Order.findOne({ _id: order_id });
        if (!userOrder) {
            return res.status(404).json({ error: "Order not found" });
        }



        // Create Razorpay order
        const orderOptions = {
            amount: (Math.ceil(amount)) * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: {
                user_id: user._id,
                description: description || "payment using Online",
                user_orderId: userOrder._id,
                //   cart_id:cart_id
            },
        };

        const order = await razorpayInstance.orders.create(orderOptions);
        console.log("order", order);

        // Save order details in Payment model
        const payment = new Payment({
            amount: (Math.ceil(amount)),
            currency: order.currency,
            status: "created",
            razorpay_order_id: order.id,
            user_id: user._id,
            // package_id: packageId,
            description: description || "payment using Online",
            receipt: order.receipt,
            razorpay_signature: order.razorpay_signature,
            // cart_id:cart_id,
            order_id: userOrder._id
        });

        await payment.save();

        res.status(200).json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Unable to create order", error });
    }
};

exports.checkPaymentStatus = async (req, res) => {
    const { razorpay_order_id } = req.body;

    try {
        // Check if payment exists
        const payment = await Payment.findOne({ razorpay_order_id: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        // Check payment status
        const paymentStatus = await razorpayInstance.orders.fetch(razorpay_order_id);

        // Update payment status
        payment.status = paymentStatus.status;
        await payment.save();

        res.status(200).json({
            success: true,
            message: "Payment status checked",
            paymentStatus: paymentStatus.status,
            paymentDetails: paymentStatus
        });
    } catch (error) {
        console.error("Error checking payment status:", error);
        res.status(500).json({ error: "Unable to check payment status" });
    }
};

exports.verifyPayment = async (req, res) => {
    const signature = req.headers['x-razorpay-signature']; // Signature sent by Razorpay
    const secrete = process.env.RAZORPAY_WEBHOOK_KEY_DEV;
    const generated_signature = crypto.createHmac('sha256', secrete);
    generated_signature.update(JSON.stringify(req.body));
    const digested_signature = generated_signature.digest('hex');
    console.log("digested_signature", digested_signature);
    console.dir("req.body", req.body, { depth: null });
    if (digested_signature === signature) {
        if (req.body.event == "payment.captured") {
            console.log("Valid signature inside payment.captured", req.body);
            console.dir(req.body, { depth: null });
            console.log("Valid signature inside payment.captured",req.body.payload.payment.entity.notes.user_id);
            // Payment is valid
            const payment = await Payment.findOne({ razorpay_order_id: req.body.payload.payment.entity.order_id });
            if (!payment) {
                return res.status(200).json({ error: 'Payment not found' });
            }
            // Update payment details
            payment.payment_id = req.body.payload.payment.entity.id;
            payment.status = 'paid';
            payment.method = req.body.payload.payment.entity.method;
            payment.acquirer_data = req.body.payload.payment.entity.acquirer_data;
            await payment.save();
            const userOrder = await Order.findById({ _id: req.body.payload.payment.entity.notes.user_orderId });
            userOrder.payment_id = payment._id;
            userOrder.order_status = "Order placed";
            await userOrder.save();
            const user = await User.findById({ _id: req.body.payload.payment.entity.notes.user_id });
            user.cart_products = [];
            await user.save();
            //  push Notification

            const userref1 = user._id;
            const title = "Order Placed Successfully!";
            const message = `Your order has been successfully placed and is now being processed.`;
            const redirectUrl = `/orders/${userOrder._id}`;
            const redirectType = "order"; // This could be dynamic based on your requirements
            const extraData = { orderId: userOrder._id }; // This could be dynamic based on your requirements
            await Notification.updateMany(
                {
                    user_ref: userref1,
                    redirect_type: "cart",
                    scheduled_time: { $gte: new Date() },
                    isDeleted: false,
                    isRead: false,
                },
                {
                    $set: { isDeleted: true },
                }
            );

            await generateAndSendNotificationNew(
                title,
                message,
                userref1,
                redirectUrl,
                null, // Optional: add image URL if needed
                redirectType,
                extraData
            );

        }else if(req.body.event == "payment.failed"){
            console.log("Valid signature inside payment.failed", req.body);
            console.dir(req.body, { depth: null });
            const payment = await Payment.findOne({ razorpay_order_id: req.body.payload.payment.entity.order_id });
            if (!payment) {
                return res.status(200).json({ error: 'Payment not found' });
            }
            // Update payment details
            payment.status = 'failed';
            await payment.save();
        }

    } else {
        console.log("Invalid signature");
    }

    res.json({ status: "ok" });
}

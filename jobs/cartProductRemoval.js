const mongoose = require("mongoose");
const CartProduct = require("../models/cart_product_model");
const Product = require("../models/product_model");
const User = require("../models/user_models");
const Warehouse = require("../models/warehouse_model");
const variations = require("../models/variation_model");
const admin = require("../config/firebase");


async function sendPushNotification(fcmToken, message) {
    if (!fcmToken) {
        console.log("No FCM token found for user.");
        return;
    }

    const payload = {
        notification: {
            title: "Cart Reminder",
            body: message,
        },
        token: fcmToken,
    };

    try {
        await admin.messaging().send(payload);
        console.log(`Push notification sent successfully: ${message}`);
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
}



async function cartCleanupJob(res) {
    console.log("Cart Cleanup Job Started...");

    try {
        const now = new Date();

        // Get all cart products
        const users = await User.find().populate("cart_products.product_ref");
        users.forEach(async (user) => {

            console.log("user", user);
            const cartItems = await User.findById(user._id).populate("cart_products.product_ref").select("cart_products");
            console.log("cartItems", cartItems);

            for (const cartItem of cartItems.cart_products) {
                const { cart_added_date, product_ref } = cartItem;
                const { sensible_product } = product_ref;

                const timeDiff = (now - new Date(cart_added_date)) / (1000 * 60 * 60); // Convert milliseconds to hours

                if (sensible_product) {
                    // Remove if older than 24 hours but send notification 1 hour before
                    if (timeDiff >= 23 && timeDiff < 24) {
                        await sendPushNotification(user.fcm_token, `Reminder: Your sensible product will be removed from the cart in 1 hour.`);
                    }
                    if (timeDiff >= 24) {



                        const product = await Product.findById(cartItem.product_ref._id);
                        const warehouse = await Warehouse.findOne({ picode: cartItem.pincode });
                        const variation = product.variations.find((item) => item._id.equals(cartItem.variant._id));
                        variation.stock.map((item) => {
                            if ((item.warehouse_ref.equals(warehouse._id))) {
                                item.stock_qty += Number(cartItem.quantity);
                                if (item.stock_qty > 0) {
                                    item.visibility = true;
                                }
                            }
                        });
                         await product.save();
                        // await CartProduct.deleteOne({ _id: cartItem._id });
                        const updatedUser = await User.findByIdAndUpdate(
                            user._id,
                            { $pull: { cart_products: cartItem } }, // Remove product from array
                            { new: true } // Return the updated document
                        )
                        console.log(`Removed sensible product from cart: ${cartItem._id}  -- ${updatedUser}`);
                    }
                } else {
                    // Remove if older than 4 days (96 hours) but send notification 1 hour before
                    if (timeDiff >= 95 && timeDiff < 96) {
                        await sendPushNotification(user.fcm_token, `Reminder: Your product will be removed from the cart in 1 hour.`);
                    }
                    if (timeDiff >= 96) {

                        const product = await Product.findById(cartItem.product_ref._id);
                        const warehouse = await Warehouse.findOne({ picode: cartItem.pincode });
                        const variation = product.variations.find((item) => item._id.equals(cartItem.variant._id));
                        variation.stock.map((item) => {
                            if ((item.warehouse_ref.equals(warehouse._id))) {
                                item.stock_qty += Number(cartItem.quantity);
                                if (item.stock_qty > 0) {
                                    item.visibility = true;
                                }
                            }
                        });
                        await product.save();
                        const updatedUser = await User.findByIdAndUpdate(
                            user._id,
                            { $pull: { cart_products: cartItem._id } }, // Remove product from array
                            { new: true } // Return the updated document
                        )
                        console.log(`Removed non-sensible product from cart: ${cartItem._id}  -- ${updatedUser}`);
                    }
                }
            }
        })

        console.log("Cart Cleanup Job Completed.");
        res.status(200).json({ message: "Cart cleanup Successful" });
    } catch (error) {
        console.error("Error in Cart Cleanup Job:", error);
    }
}

// cron.schedule("0 * * * *", () => {
//     cartCleanupJob();
// });

module.exports = cartCleanupJob;

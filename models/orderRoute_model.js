const mongoose = require("mongoose");
const User = require("./user_models"); // Import the User model



// Define the Order schema
const orderRouteSchema = new mongoose.Schema({

    warehouse_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: [true, "Warehouse reference is required"],
        validate: {
            validator: async (v) => {
                const warehouseExists = await mongoose
                    .model("Warehouse")
                    .exists({ _id: v });
                return warehouseExists;
            },
            message: "Invalid warehouse reference",
        },
    },
    tum_tumdelivery_start_time: { type: Date },
    tumtumdelivery_end_time: { type: Date },
    Routes: [
        {
            orders: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Order",

                },   
            ],
            assigned_delivery_boy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: [false, "Delivery boy reference is required"],
                validate: {
                    validator: async (v) => {

                    }
                }
            },
            map_url: { type: String },
        }
    ],
    assigned_delivery_boy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [false, "Delivery boy reference is required"],
        validate: {
            validator: async (v) => {
                const deliveryBoyExists = await mongoose
                    .model("User")
                    .exists({ _id: v });
                return deliveryBoyExists;
            },
            message: "Invalid delivery boy reference",
        },
    }],


    created_time: {
        type: Date,
        required: [true, "Creation time is required"],
        default: Date.now,
    },
});

// Create and export the Order model
module.exports = mongoose.model("OrderRoute", orderRouteSchema);

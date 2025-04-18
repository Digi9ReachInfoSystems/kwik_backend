const mongoose = require("mongoose");

const deliveryAssignmentSchema = new mongoose.Schema({
    orders: [{
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: [true, "Order reference is required"],
            validate: {
                validator: function (value) {
                    return mongoose.Types.ObjectId.isValid(value);
                },
                message: "Invalid order reference",
            },
        },
        status: {
            type: String,
            required: [true, "Status is required"],
            enum: ["Pending", "Completed"],
        },
    }],
    tum_tumdelivery_start_time: { type: Date },
    tumtumdelivery_end_time: { type: Date },
    map_url: { type: String },
    delivery_boy_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Delivery boy reference is required"],
        validate: {
            validator: function (value) {
                return mongoose.Types.ObjectId.isValid(value);
            },
            message: "Invalid delivery boy reference",
        },
    },
    status: {
        type: String,
        required: [true, "Status is required"],
        enum: ["Pending", , "Completed"],
        default: "Pending",
    },
    created_time: {
        type: Date,
        required: [true, "Creation time is required"],
        default: Date.now,
    },
})


module.exports = mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);
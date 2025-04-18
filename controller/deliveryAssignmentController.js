const DeliveryAssignment = require("../models/deliveryAssignment_model");
const User = require("../models/user_models")
const Order = require("../models/order_model")
const moment = require("moment");

exports.getOrdersByDeliveryBoy = async (req, res) => {
    try {
        const { deliveryBoyId } = req.params;
        const { time } = req.query
        const user = await User.findOne({ UID: deliveryBoyId })
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const deliveryAssignments = await DeliveryAssignment.find({
            delivery_boy_ref: user._id,
            tum_tumdelivery_start_time: {
                $gte: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").startOf('hour').local().toDate(),
                $lt: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").endOf('hour').local().toDate(),
            },
        }).exec();
        res.status(200).json({ success: true, data: deliveryAssignments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// exports.updateOrderStatus = async (req, res) => {
//     try {
//         const { orderId,otp, } = req.body;
//         const user = await User.findOne({ UID: deliveryBoyId })
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found" });
//         }
//         const assignment = await DeliveryAssignment.findOne({
//             "orders.orderId": orderId
//         });
//         if (!assignment) {
//             return res.status(404).json({ message: "Delivery assignment not found" });
//         }
//         const subOrder = assignment.orders.find(o => o.orderId.equals(orderId));
//         subOrder.status = "Completed";
//         const allDone = assignment.orders.every(o => o.status === "Completed");
//         if (allDone) {
//             assignment.status = "Completed";
//         }
//         await assignment.save();
//         return res.json({
//             message: "Order updated",
//             assignment
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };
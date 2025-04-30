const DeliveryAssignment = require("../models/deliveryAssignment_model");
const User = require("../models/user_models");
const Order = require("../models/order_model");
const OrderRoute = require("../models/orderRoute_model");
const moment = require("moment");
const {
  generateAndSendNotificationNew,
} = require("../controller/notificationController");

exports.getOrdersByDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { time } = req.query;
    const user = await User.findOne({ UID: deliveryBoyId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const deliveryAssignments = await DeliveryAssignment.find({
      delivery_boy_ref: user._id,
      tum_tumdelivery_start_time: {
        $gte: moment(
          `${moment().format("YYYY-MM-DD")} ${time}`,
          "YYYY-MM-DD h:mm A"
        )
          .startOf("hour")
          .local()
          .toDate(),
        $lt: moment(
          `${moment().format("YYYY-MM-DD")} ${time}`,
          "YYYY-MM-DD h:mm A"
        )
          .endOf("hour")
          .local()
          .toDate(),
      },
      status: "Pending",
    })
      .populate({
        path: "orders.orderId",
        model: "Order",
        populate: {
          path: "products.product_ref",
          model: "Product",
        },
      })
      .populate({
        path: "orders.orderId",
        model: "Order",
        populate: {
          path: "warehouse_ref",
          model: "Warehouse",
        },
      })
      .populate({
        path: "orders.orderId",
        model: "Order",
        populate: {
          path: "user_ref",
          model: "User",
        },
      })
      .exec();
    res.status(200).json({ success: true, data: deliveryAssignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deliverOrder = async (req, res) => {
  try {
    const { orderId, otp, deliveryBoyId } = req.body;
    const user = await User.findOne({ UID: deliveryBoyId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    if (order.otp !== otp) {
      return res.status(200).json({ success: false, message: "Invalid OTP" });
    }

    // Update order status to "Delivered"
    order.order_status = "Delivered";
    order.completed_time = new Date();
    await order.save();

    const assignment = await DeliveryAssignment.findOne({
      delivery_boy_ref: user._id,
      "orders.orderId": orderId,
    });
    if (!assignment) {
      return res.status(404).json({ message: "Delivery assignment not found" });
    }

    const subOrder = assignment.orders.find((o) => o.orderId.equals(orderId));
    subOrder.status = "Completed";
    const newAssignment = await assignment.save();

    const allDone = newAssignment.orders.every((o) => o.status === "Completed");
    if (allDone) {
      assignment.status = "Completed";
      user.deliveryboy_order_availability_status.tum_tum = true;
    }
    await assignment.save();

    const orderRoute = await OrderRoute.findById(assignment.orderRoute_ref);
    if (!orderRoute) {
      return res.status(404).json({ message: "Order route not found" });
    }
    const route = orderRoute.route.find((route) =>
      route._id.equals(assignment.route_id)
    );
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    route.delivery_status = "Completed";
    const newRoute = await orderRoute.save();

    const allDoneRoute = newRoute.route.every(
      (o) => o.delivery_status === "Completed"
    );
    if (allDoneRoute) {
      orderRoute.delivery_status = "Completed";
    }
    await orderRoute.save();
    await user.save();

    // Send notification to the user who placed the order
    const userRef = order.user_ref;
    const userWhoPlacedOrder = await User.findById(userRef);
    if (!userWhoPlacedOrder) {
      return res.status(404).json({
        success: false,
        message: "User who placed the order not found",
      });
    }

    // Define notification details
    const title = "Your Order Has Been Delivered!";
    const message = `Your order #${orderId} has been successfully delivered. Thank you for shopping with us!`;
    const redirectUrl = `/orders/${orderId}`; // Redirect user to their order page
    const redirectType = "order"; // Redirect type (can be used for custom logic)
    const extraData = { orderId };

    // Send the notification
    await generateAndSendNotificationNew(
      title,
      message,
      userWhoPlacedOrder.UID, // User reference of the person who placed the order
      redirectUrl,
      null, // Optional: add image URL if needed
      redirectType,
      extraData
    );

    return res.json({
      message: "Order updated and notification sent",
      assignment,
    });
  } catch (error) {
    console.error("Error delivering order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

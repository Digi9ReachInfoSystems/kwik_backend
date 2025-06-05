const DeliveryAssignment = require("../models/deliveryAssignment_model");
const User = require("../models/user_models");
const Order = require("../models/order_model");
const OrderRoute = require("../models/orderRoute_model");
const mongoose = require("mongoose");
const moment = require('moment-timezone');
const {
  generateAndSendNotificationNew,
} = require("../controller/notificationController");
const Warehouse = require("../models/warehouse_model");

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
    const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const timeMoment = moment.tz(`${today} ${time}`, 'YYYY-MM-DD h:mm A', 'Asia/Kolkata');
    const utcStart = timeMoment.clone().startOf('hour').utc();
    const utcEnd = timeMoment.clone().endOf('hour').utc();
    console.log("utcStart", utcStart, "utcEnd", utcEnd);
    const deliveryAssignments = await DeliveryAssignment.find({
      delivery_boy_ref: user._id,
      tum_tumdelivery_start_time: {
        // $gte: moment(
        //   `${moment().format("YYYY-MM-DD")} ${time}`,
        //   "YYYY-MM-DD h:mm A"
        // )
        //   .startOf("hour")
        //   .local()
        //   .toDate(),
        // $lt: moment(
        //   `${moment().format("YYYY-MM-DD")} ${time}`,
        //   "YYYY-MM-DD h:mm A"
        // )
        //   .endOf("hour")
        //   .local()
        //   .toDate(),
        $gte: utcStart.toDate(),
        $lt: utcEnd.toDate()
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
    if (assignment.orderRoute_ref) {
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
    }
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

exports.assignSingleOrder = async (req, res) => {
  try {
    const { orderId, deliveryBoyId } = req.body;
    const user = await User.findById(deliveryBoyId);
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
    const warehouse = await Warehouse.findById(order.warehouse_ref);
    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    order.order_status = "Out for delivery";
    order.delivery_boy = user._id;
    order.out_for_delivery_time = new Date();
    await order.save();
    const mapUrl = `https://www.google.com/maps/dir/?api=1` +
      `&origin=${warehouse.warehouse_location.lat},${warehouse.warehouse_location.lng}` +
      `&destination=${order.user_location.lat},${order.user_location.lang}` +
      // `&waypoints=${optimizedDestinations.map(d => `${d.lat},${d.lng}`).join('|')}` +
      `&travelmode=driving` +
      `&dir_action=navigate`;

    const assignment = new DeliveryAssignment({
      orderRoute_ref: null,
      route_id: null,
      orders: [
        {
          orderId: order._id,
          status: "Pending",
          delivery_boy_ref: user._id,
        },
      ],
      tum_tumdelivery_start_time: order.selected_time_slot,
      tumtumdelivery_end_time: order.selected_time_slot,
      status: "Pending",
      delivery_boy_ref: user._id,
      map_url: mapUrl
    })
    await assignment.save();
    return res.json({ message: "Order Assigned", assignment });
  } catch (error) {
    console.error("Error assigning order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};  

exports.deliveryFailedOrder = async (req, res) => {
  try {
    const { orderId, deliveryBoyId } = req.body;
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
    

    // Update order status to "Delivered"
    order.order_status = "Delivery failed";
    order.failed_time = new Date();
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
    if (assignment.orderRoute_ref) {
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
    }
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

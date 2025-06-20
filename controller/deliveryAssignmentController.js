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
const axios = require("axios");
const { generateAndSendNotificationService } = require("../utils/notificationService");

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
    // const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    // const timeMoment = moment.tz(`${today} ${time}`, 'YYYY-MM-DD h:mm A', 'Asia/Kolkata');
    // const utcStart = timeMoment.clone().startOf('hour').utc();
    // const utcEnd = timeMoment.clone().endOf('hour').utc();

    const today = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const timeMoment = moment.tz(`${today}`, 'YYYY-MM-DD', 'Asia/Kolkata');
    const utcStart = timeMoment.clone().startOf('day').utc(); // 00:00:00
    const utcEnd = timeMoment.clone().endOf('day').utc();     // 23:59:59.999

    const deliveryAssignments = await DeliveryAssignment.find({
      delivery_boy_ref: user._id,
      //uncomment if they want today's order
      // tum_tumdelivery_start_time: {
      //   // $gte: moment(
      //   //   `${moment().format("YYYY-MM-DD")} ${time}`,
      //   //   "YYYY-MM-DD h:mm A"
      //   // )
      //   //   .startOf("hour")
      //   //   .local()
      //   //   .toDate(),
      //   // $lt: moment(
      //   //   `${moment().format("YYYY-MM-DD")} ${time}`,
      //   //   "YYYY-MM-DD h:mm A"
      //   // )
      //   //   .endOf("hour")
      //   //   .local()
      //   //   .toDate(),
      //   $gte: utcStart.toDate(),
      //   $lt: utcEnd.toDate()
      // },
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
      user.deliveryboy_order_availability_status.instant.status = true;
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
    await generateAndSendNotificationService(
      {
        title,
        message,
        userId: userRef, // User reference of the person who placed the order
        redirectUrl,
        imageUrl: null, // Optional: add image URL if needed
        redirectType,
        extraData
      }
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
    const { orderIds, deliveryBoyId } = req.body;
    const user = await User.findById(deliveryBoyId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (orderIds.length === 0) {
      return res.status(400).json({ success: false, message: "No order IDs provided" });
    }
    if (orderIds.length > 25) {
      return res.status(400).json({ success: false, message: "Maximum 25 order IDs allowed" });
    }
    const warehouse = await Warehouse.findById(user.selected_warehouse);
    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }
    const source = warehouse.warehouse_location;

    const order = await Order.find({ _id: { $in: orderIds }, order_status: "Order placed" });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    console.log("order", order);
    let startTime;
    let endTime;
    const destinations = order.map(order => {
      startTime = order.selected_time_slot;
      endTime = new Date(order.selected_time_slot.getTime() + 60 * 60 * 1000);
      return ({
        lat: order.user_location.lat,
        lng: order.user_location.lang,
        orders: order._id
      })
    });
    let tempDesitinations = destinations;
    let tempSource = source;
    let optimizedDestinations = [];
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log("orderIds", orderIds, "destinations", destinations, "source", source);

    if (orderIds.length > 1) {
      while (tempDesitinations.length > 0) {
        const origin = `${tempSource.lat},${tempSource.lng}`;
        const destStr = tempDesitinations
          .map(dest => `${dest.lat},${dest.lng}`)
          .join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destStr}&key=${apiKey}`;

        const response = await axios.get(url);
        const data = response.data;
        if (data.status !== 'OK') {
          return res.status(500).json({ message: "Failed to fetch distance data", details: data.error_message });
        }
        let distances = data.rows[0].elements.map((el, index) => ({
          destination: tempDesitinations[index],
          distance: el.distance?.text,
          duration: el.duration?.text,
          value: el.distance?.value,
          status: el.status
        }));
        const validDistances = distances.filter(d => d.status === 'OK' && d.value !== undefined);
        const minDistance = Math.min(...validDistances.map(d => d.value));
        const minDistanceObj = validDistances.find(d => d.value === minDistance);
        if (minDistanceObj) {
          optimizedDestinations.push({ ...minDistanceObj.destination, meter_distance: minDistance });
          tempDesitinations = tempDesitinations.filter(dest => {
            return (dest !== minDistanceObj.destination);
          });
          tempSource = minDistanceObj.destination; // Update source to the last selected destination
          tempSource = {
            lat: minDistanceObj.destination.lat,
            lng: minDistanceObj.destination.lng
          };
        }
      }

      console.log("optimizedDestinations", optimizedDestinations);

      const finalDestinations = optimizedDestinations.map(dest => {
        return ({
          orderId: dest.orders,
          status: "Pending",
          delivery_boy_ref: user._id,
        });
      });
      let waypoints = optimizedDestinations
        .slice(0, -1) // Removes the last element
        .map(d => ({
          lat: d.lat,
          lng: d.lng,
        }));
      const mapsUrl =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${warehouse.warehouse_location.lat},${warehouse.warehouse_location.lng}` +
        `&destination=${optimizedDestinations[optimizedDestinations.length - 1].lat},${optimizedDestinations[optimizedDestinations.length - 1].lng
        }` +
        `&waypoints=${waypoints
          .map((d) => `${d.lat},${d.lng}`)
          .join("|")}` +
        `&travelmode=driving` +
        `&dir_action=navigate`;
      user.assigned_orders_with_mapUrl = {
        orders: finalDestinations,
        map_url: mapsUrl,
        status: "Pending",
      }
      finalDestinations.map(async (dest) => {
        const order = await Order.findById(dest.orderId);
        if (order) {
          order.order_status = "Out for delivery";
          order.out_for_delivery_time = new Date();
          const title = "Your Order is Out for Delivery!";
          const message = `Your order #${order._id} is now out for delivery and will be with you shortly.`;
          const redirectUrl = `/orders/${order._id}`;
          const redirectType = "order";
          const extraData = { orderId: order._id };

          // Send the notification
          await generateAndSendNotificationService(
            {
              title,
              message,
              userId: order.user_ref, // User reference who placed the order
              redirectUrl,
              imageUrl: null, // Optional: Add image URL if required
              redirectType,
              extraData
            }
          );

          const delivery_title = "New Tum Tum Order Assigned!";
          const delivery_message = `The order #${order._id} has been assigned to you. Thank you for working with us!`;
          const delivery_redirectUrl = `/orders/${order._id}`; // Redirect user to their order page
          const delivery_redirectType = "order"; // Redirect type (can be used for custom logic)
          const delivery_extraData = { orderId: order._id };

          // Send the notification
          await generateAndSendNotificationService(
            {
              title: delivery_title,
              message: delivery_message,
              userId: deliveryBoyId, // User reference of the person who placed the order
              redirectUrl: null,
              imageUrl: null, // Optional: add image URL if needed
              redirectType: null,
              extraData: delivery_extraData
            }
          );
          order.save();
        }
      });

      const assignment = new DeliveryAssignment({
        orderRoute_ref: null,
        route_id: null,
        orders: finalDestinations,
        tum_tumdelivery_start_time: startTime,
        tumtumdelivery_end_time: endTime,
        status: "Pending",
        delivery_boy_ref: user._id,
        map_url: mapsUrl
      })
      await assignment.save();
      user.deliveryboy_order_availability_status.tum_tum = false;
      user.deliveryboy_order_availability_status.instant.status = false;
      await user.save();
      return res.json({ success: true, message: "Order Assigned", assignment });

    } else {

      const foundOrder = await Order.findOne({ _id: orderIds[0], order_status: "Order placed" });
      foundOrder.order_status = "Out for delivery";
      foundOrder.delivery_boy = user._id;
      foundOrder.out_for_delivery_time = new Date();
      await foundOrder.save();
      const mapUrl = `https://www.google.com/maps/dir/?api=1` +
        `&origin=${warehouse.warehouse_location.lat},${warehouse.warehouse_location.lng}` +
        `&destination=${foundOrder.user_location.lat},${foundOrder.user_location.lang}` +
        // `&waypoints=${optimizedDestinations.map(d => `${d.lat},${d.lng}`).join('|')}` +
        `&travelmode=driving` +
        `&dir_action=navigate`;

      const assignment = new DeliveryAssignment({
        orderRoute_ref: null,
        route_id: null,
        orders: [
          {
            orderId: foundOrder._id,
            status: "Pending",
            delivery_boy_ref: foundOrder._id,
          },
        ],
        tum_tumdelivery_start_time: foundOrder.selected_time_slot,
        tumtumdelivery_end_time: foundOrder.selected_time_slot,
        status: "Pending",
        delivery_boy_ref: user._id,
        map_url: mapUrl
      })
      await assignment.save();
      user.deliveryboy_order_availability_status.tum_tum = false;
      user.deliveryboy_order_availability_status.instant.status = false;
      await user.save();
      const title = "Your Order is Out for Delivery!";
      const message = `Your order #${foundOrder._id} is now out for delivery and will be with you shortly.`;
      const redirectUrl = `/orders/${foundOrder._id}`;
      const redirectType = "order";
      const extraData = { orderId: foundOrder._id };

      // Send the notification
      await generateAndSendNotificationService(
        {
          title,
          message,
          userId: foundOrder.user_ref, // User reference who placed the order
          redirectUrl,
          imageUrl: null, // Optional: Add image URL if required
          redirectType,
          extraData
        }
      );
      const delivery_title = "New Tum Tum Order Assigned!";
      const delivery_message = `The order #${foundOrder._id} has been assigned to you. Thank you for working with us!`;
      const delivery_redirectUrl = `/orders/${foundOrder._id}`; // Redirect user to their order page
      const delivery_redirectType = "order"; // Redirect type (can be used for custom logic)
      const delivery_extraData = { orderId: foundOrder._id };

      // Send the notification
      await generateAndSendNotificationService(
        {
          title: delivery_title,
          message: delivery_message,
          userId: deliveryBoyId, // User reference of the person who placed the order
          redirectUrl: null,
          imageUrl: null, // Optional: add image URL if needed
          redirectType: null,
          extraData: delivery_extraData
        }
      );
      return res.json({ success: true, message: "Order Assigned", assignment });
    }



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
      user.deliveryboy_order_availability_status.instant.status = false;
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
    const title = "Your Order Has Been Cancelled or Failed to be Delivered!";
    const message = `Your order #${orderId} has been cancelled or failed to be delivered due to some reason. Thank you for shopping with us!`;
    const redirectUrl = `/orders/${orderId}`; // Redirect user to their order page
    const redirectType = "order"; // Redirect type (can be used for custom logic)
    const extraData = { orderId };

    // Send the notification
    await generateAndSendNotificationService(
      {
        title,
        message,
        userId: order.user_ref, // User reference who placed the order
        redirectUrl,
        imageUrl: null, // Optional: Add image URL if required
        redirectType,
        extraData
      }
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

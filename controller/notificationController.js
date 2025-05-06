const Notification = require("../models/notifications_model");
const User = require("../models/user_models");
const mongoose = require("mongoose");
// const { agenda } = require("../utils/agenda"); // Import your agenda instance

// Firebase Admin SDK (if you're using FCM)
const admin = require("firebase-admin"); // Make sure it's initialized

/**
 * Utility Function to Generate & Send Notification
 */ const generateAndSendNotification = async (
  title,
  message,
  userRefs, // Accepts array of user IDs
  redirectUrl = null,
  imageUrl = null,
  redirectType = null,
  extraData = {}
) => {
  try {
    // Ensure userRefs is always an array
    const userIds = Array.isArray(userRefs) ? userRefs : [userRefs];

    // Fetch all valid users in one query
    const users = await User.find({
      _id: { $in: userIds },
      isDeleted: { $ne: true },
    });

    if (!users.length) {
      throw new Error("No valid users found.");
    }

    // Prepare notifications and payloads
    const notificationsToCreate = [];
    const fcmPayloads = [];

    users.forEach((user) => {
      notificationsToCreate.push({
        title,
        message,
        user_ref: user._id,
        redirect_url: redirectUrl,
        redirect_type: redirectType,
        redirect_data: extraData,
        image_url: imageUrl,
      });

      if (user.fcm_token) {
        // Ensure that extraData values are strings
        const serializedExtraData = {};
        for (const key in extraData) {
          if (extraData.hasOwnProperty(key)) {
            serializedExtraData[key] = String(extraData[key]); // Convert to string
          }
        }

        fcmPayloads.push({
          token: user.fcm_token,
          notification: {
            title,
            body: message,
            ...(imageUrl && { imageUrl }),
          },
          data: {
            redirect_to: redirectUrl || "",
            ...serializedExtraData, // Using serialized extra data
            notification_id: "future_id_placeholder", // Will be replaced after DB insert
          },
        });
      }
    });

    // Save all notifications to DB
    const notifications = await Notification.insertMany(notificationsToCreate);

    // Replace placeholder notification_ids in FCM payloads
    const notificationMap = {};
    notifications.forEach((notif) => {
      notificationMap[notif.user_ref.toString()] = notif._id.toString();
    });

    const finalFcmPayloads = fcmPayloads.map((payload) => {
      const userId = payload.data.userId;
      return {
        ...payload,
        data: {
          ...payload.data,
          notification_id: notificationMap[userId] || "",
        },
      };
    });

    // Send FCM notifications
    for (const payload of finalFcmPayloads) {
      try {
        await admin.messaging().send(payload);
      } catch (fcmError) {
        console.error("Failed to send FCM message:", fcmError.message);
      }
    }

    return {
      success: true,
      totalSent: notifications.length,
      notificationIds: notifications.map((n) => n._id),
    };
  } catch (error) {
    console.error("Error generating/sending notification:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * API Controller: Send Notification Manually via Endpoint
 */
exports.SendNotification = async (req, res) => {
  const {
    title,
    message,
    user_ref,
    redirect_url,
    image_url,
    redirect_type,
    extra_data,
  } = req.body;

  try {
    const notification = await generateAndSendNotification(
      title,
      message,
      user_ref,
      redirect_url,
      image_url,
      redirect_type,
      extra_data
    );

    if (!notification) {
      return res
        .status(400)
        .json({ success: false, message: "Notification failed" });
    }

    return res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Example: Order Updates Notification
 */
exports.OrderUpdates = async (req, res) => {
  const { user_ref, orderId } = req.body;

  const title = "Order Update";
  const message = `Your order #${orderId} has been updated.`;
  const redirectUrl = `/orders/${orderId}`;
  const redirectType = "order";
  const extraData = { orderId };

  const notification = await generateAndSendNotification(
    title,
    message,
    user_ref,
    redirectUrl,
    null,
    redirectType,
    extraData
  );

  if (!notification) {
    return res
      .status(400)
      .json({ success: false, message: "Failed to send order update" });
  }

  return res.json({ success: true, notification });
};

/**
 * Example: Coupon Notification
 */
exports.SendNotificationForCoupon = async (req, res) => {
  const { user_ref, couponCode } = req.body;

  const title = "New Coupon Available!";
  const message = `You have received a new coupon: ${couponCode}`;
  const redirectUrl = "/coupons";
  const redirectType = "coupon";
  const extraData = { couponCode };

  const notification = await generateAndSendNotification(
    title,
    message,
    user_ref,
    redirectUrl,
    null,
    redirectType,
    extraData
  );

  if (!notification) {
    return res
      .status(400)
      .json({ success: false, message: "Failed to send coupon notification" });
  }

  return res.json({ success: true, notification });
};

/**
 * Example: Idle Cart Reminder
 */
exports.SendNotificationForIdleCart = async (req, res) => {
  const { user_ref } = req.body;

  const title = "Don't Forget Your Cart!";
  const message = "You have items waiting in your cart.";
  const redirectUrl = "/cart";
  const redirectType = "cart";

  const notification = await generateAndSendNotification(
    title,
    message,
    user_ref,
    redirectUrl,
    null,
    redirectType
  );

  if (!notification) {
    return res
      .status(400)
      .json({ success: false, message: "Failed to send cart reminder" });
  }

  return res.json({ success: true, notification });
};

/**
 * Example: Product Updates
 */
exports.ProductUpdates = async (req, res) => {
  const { user_ref, productId, productName } = req.body;

  const title = "Product Updated";
  const message = `The product "${productName}" has been updated.`;
  const redirectUrl = `/products/${productId}`;
  const redirectType = "product";
  const extraData = { productId, productName };

  const notification = await generateAndSendNotification(
    title,
    message,
    user_ref,
    redirectUrl,
    null,
    redirectType,
    extraData
  );

  if (!notification) {
    return res
      .status(400)
      .json({ success: false, message: "Failed to send product update" });
  }

  return res.json({ success: true, notification });
};
exports.scheduleDynamicNotification = async (req, res) => {
  const {
    title,
    message,
    user_ref,
    scheduledAt,
    redirectType,
    redirectUrl,
    image_url,
  } = req.body;

  // Validate required fields
  if (!title || !message || !user_ref || !scheduledAt) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  // Parse the scheduled time and validate it
  const scheduledTime = new Date(scheduledAt);
  if (isNaN(scheduledTime.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid date format",
    });
  }

  try {
    // Ensure user_ref is an array
    const userIds = Array.isArray(user_ref) ? user_ref : [user_ref];

    // Find all users and collect FCM tokens
    const users = await User.find({
      _id: { $in: userIds },
      fcm_token: { $exists: true, $ne: null },
    });

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid users found or missing FCM tokens",
      });
    }

    // Prepare notifications to insert
    const notificationsToSave = users.map((user) => ({
      title,
      message,
      user_ref: user._id,
      redirect_type: redirectType || null,
      redirect_url: redirectUrl || null,
      image_url: image_url || null,
      fcm_token: user.fcm_token, // Use user's FCM token
      scheduled_time: scheduledTime,
    }));

    // Save all notifications to DB
    await Notification.insertMany(notificationsToSave);

    return res.json({
      success: true,
      message: `Notifications scheduled for ${scheduledTime.toISOString()}`,
    });
  } catch (error) {
    console.error("Error scheduling notification:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.generateAndSendNotificationNew = async (
  title,
  message,
  userRefs, // Accepts array of user IDs
  redirectUrl = null,
  imageUrl = null,
  redirectType = null,
  extraData = {}
) => {
  try {
    // Ensure userRefs is always an array
    const userIds = Array.isArray(userRefs) ? userRefs : [userRefs];

    // Fetch all valid users in one query
    const users = await User.find({
      _id: { $in: userIds },
      isDeleted: { $ne: true },
    });

    if (!users.length) {
      throw new Error("No valid users found.");
    }

    // Prepare notifications and payloads
    const notificationsToCreate = [];
    const fcmPayloads = [];

    users.forEach((user) => {
      notificationsToCreate.push({
        title,
        message,
        user_ref: user._id,
        redirect_url: redirectUrl,
        redirect_type: redirectType,
        redirect_data: extraData,
        image_url: imageUrl,
      });

      if (user.fcm_token) {
        // Ensure that extraData values are strings
        const serializedExtraData = {};
        for (const key in extraData) {
          if (extraData.hasOwnProperty(key)) {
            serializedExtraData[key] = String(extraData[key]); // Convert to string
          }
        }

        fcmPayloads.push({
          token: user.fcm_token,
          notification: {
            title,
            body: message,
            ...(imageUrl && { imageUrl }),
          },
          data: {
            redirect_to: redirectUrl || "",
            ...serializedExtraData, // Using serialized extra data
            notification_id: "future_id_placeholder", // Will be replaced after DB insert
          },
        });
      }
    });

    // Save all notifications to DB
    const notifications = await Notification.insertMany(notificationsToCreate);

    // Replace placeholder notification_ids in FCM payloads
    const notificationMap = {};
    notifications.forEach((notif) => {
      notificationMap[notif.user_ref.toString()] = notif._id.toString();
    });

    const finalFcmPayloads = fcmPayloads.map((payload) => {
      const userId = payload.data.userId;
      return {
        ...payload,
        data: {
          ...payload.data,
          notification_id: notificationMap[userId] || "",
        },
      };
    });

    // Send FCM notifications
    for (const payload of finalFcmPayloads) {
      try {
        await admin.messaging().send(payload);
      } catch (fcmError) {
        console.error("Failed to send FCM message:", fcmError.message);
      }
    }

    return {
      success: true,
      totalSent: notifications.length,
      notificationIds: notifications.map((n) => n._id),
    };
  } catch (error) {
    console.error("Error generating/sending notification:", error.message);
    return { success: false, error: error.message };
  }
};

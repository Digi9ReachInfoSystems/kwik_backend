const mongoose = require("mongoose");
const User = require("../models/user_models");
const Notification = require("../models/notifications_model");
const { generateAndSendNotificationNew } = require("../controller/notificationController");
const admin = require("firebase-admin");
exports.generateAndSendNotificationService = async ({
    title,
    message,
    userId, // single or array
    redirectUrl = null,
    imageUrl = null,
    redirectType = null,
    extraData = {},
}) => {
    try {
        // ────────────── Extract & validate basic fields ──────────────
        // const {
        //     title,
        //     message,
        //     userId, // single or array
        //     redirectUrl = null,
        //     imageUrl = null,
        //     redirectType = null,
        //     extraData = {},
        // } = req.body;

        if (!title || !message || !userId) {
            return ({
                success: false,
                message: "title, message & userId are required",
            });
        }

        // ────────────── Normalise userId(s) & basic validity check ──────────────
        const userIds = (Array.isArray(userId) ? userId : [userId]).filter((id) =>
            mongoose.Types.ObjectId.isValid(id)
        );

        if (userIds.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "No valid Mongo user IDs supplied" });
        }

        // ────────────── Make sure at least one user has an FCM token ──────────────
        const usersWithToken = await User.find({
            _id: { $in: userIds },
            isDeleted: { $ne: true },
            fcm_token: { $exists: true, $ne: null },
        }).select("_id fcm_token");

        if (!usersWithToken.length) {
            return ({
                success: false,
                message: "No users with valid FCM tokens found for given ID(s)",
            });
        }

        // ────────────── Delegate to reusable service ──────────────
        const result = await generateAndSendNotification(
            title,
            message,
            usersWithToken.map((u) => u._id.toString()), 
            redirectUrl,
            imageUrl,
            redirectType,
            extraData
        );

        // Service already returns { success: false, error } on problems
        if (!result.success) {
            return ({ success: false, result: result });
        }

        return ({ success: true, result: result });
    } catch (error) {
        console.error("Notification controller error:", error);
        return ({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};


const generateAndSendNotification = async (
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
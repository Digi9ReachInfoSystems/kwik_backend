// utils/cartUtils.js
const Notification = require("../models/notifications_model");

exports.scheduleIdleCartReminder = async (user) => {
  try {
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 2); // 2-hour delay

    // Delete any existing idle cart notifications
    await Notification.updateMany(
      {
        user_ref: user._id,
        redirect_type: "cart",
        scheduled_time: { $gte: new Date() },
        isDeleted: false,
        isRead: false,
      },
      {
        $set: { isDeleted: true },
      }
    );

    // Schedule new notification
    const cartNotification = new Notification({
      title: "Your Cart Is Waiting!",
      message: "Don't forget about your items.",
      redirect_url: "/cart",
      redirect_type: "cart",
      user_ref: user._id,
      fcm_token: user.fcm_token || null,
      scheduled_time: scheduledTime,
    });

    await cartNotification.save();
  } catch (error) {
    console.error("Error scheduling cart reminder:", error.message);
  }
};

const cron = require("node-cron");
const mongoose = require("mongoose");
const Notification = require("../models/notifications_model");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    // Use service account credentials from environment variables or JSON file
    credential: admin.credential.applicationDefault(), // or use .cert(...) for custom config
  });
}

// Connect to MongoDB if not already connected
mongoose.connect(
  // "mongodb+srv://arjunjpdev:Arjun!23@cluster0.rsz9u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Run every minute
 async function sendNotifications ()  {
  console.log(
    "🕒 Running scheduled notification check at:",
    new Date().toISOString()
  );

  const now = new Date();

  // Truncate milliseconds to compare seconds exactly
  const nowTruncated = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0,
    0
  );

  // Query: only match notifications where scheduled_time == current minute (ignoring past)
  const query = {
    scheduled_time: {
      $gte: nowTruncated,
      $lt: new Date(nowTruncated.getTime() + 60000), // next 60 seconds
    },
    isDeleted: false,
    fcm_token: { $exists: true, $ne: null },
    isRead: false,
  };

  try {
    const notifications = await Notification.find(query);

    console.log(`📨 Found ${notifications.length} notifications to send`);

    if (notifications.length === 0) return;

    for (let notification of notifications) {
      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
          imageUrl: notification.image_url || undefined,
        },
        token: notification.fcm_token,
        data: {
          redirectType: notification.redirect_type || "",
          redirectUrl: notification.redirect_url || "",
        },
      };

      try {
        const response = await admin.messaging().send(message);
        console.log(
          `✅ Sent notification "${notification.title}" to ${notification.fcm_token}`
        );
        console.log("Response:", response);

        // Mark as read after sending
        await Notification.findByIdAndUpdate(notification._id, {
          isRead: true,
        });
      } catch (error) {
        console.error(
          `❌ Failed to send notification "${notification.title}"`,
          error.message
        );
        console.error("Full error:", error.stack);
      }
    }
  } catch (err) {
    console.error("🚫 Error fetching notifications:", err.message);
    console.error("Full error object:", err.stack);
  }
};

cron.schedule("* * * * *", () =>
    sendNotifications().catch((e) => console.error("[Scheduler] Fatal:", e))
);

module.exports = {
  sendNotifications,
};

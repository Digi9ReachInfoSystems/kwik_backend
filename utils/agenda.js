// Import necessary libraries
const Agenda = require("agenda");
const {
  generateAndSendNotification,
} = require("../controller/notificationController"); // Import the notification function

// MongoDB connection string (replace with your actual connection string or environment variable)
const MONGODB_CONNECTION_STRING =
  process.env.MONGO_URI ||
  "mongodb+srv://arjunjpdev:Arjun!23@cluster0.rsz9u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create the Agenda instance
const agenda = new Agenda({
  db: {
    address: MONGODB_CONNECTION_STRING, // MongoDB connection string
    collection: "NotificationJobs", // Collection to store jobs
    options: { useUnifiedTopology: true }, // Connection options
  },
});

// Define a job to send scheduled notifications
agenda.define("sendScheduledNotification", async (job, done) => {
  const { title, message, user_ref, redirectUrl, redirectType, extraData } =
    job.attrs.data;

  try {
    // This is where you will generate and send the notification
    console.log(
      `Sending scheduled notification to user ${user_ref} with title: ${title} and message: ${message}`
    );

    // Call the generateAndSendNotification function to handle the actual sending process
    const result = await generateAndSendNotification(
      title,
      message,
      user_ref, // You may pass a single user_ref or an array of user IDs
      redirectUrl,
      null, // For example, you can pass an image URL or additional params if needed
      redirectType,
      extraData
    );

    if (result.success) {
      console.log(`Notification successfully sent to user ${user_ref}`);
    } else {
      console.error(
        `Failed to send notification to user ${user_ref}: ${result.error}`
      );
    }

    done(); // Mark the job as completed
  } catch (error) {
    console.error(
      `Error in sending notification to user ${user_ref}:`,
      error.message
    );
    done(new Error("Notification failed")); // Pass error to Agenda to mark the job as failed
  }
});

// Start Agenda job scheduler
const startAgenda = async () => {
  try {
    await agenda.start(); // Start the job scheduler
    console.log("Agenda job scheduler started.");
  } catch (err) {
    console.error("Failed to start Agenda:", err.message);
  }
};

// Ensure Agenda starts automatically when the application starts
startAgenda();

// Export the agenda instance for use in other parts of the application
module.exports = { agenda, startAgenda };

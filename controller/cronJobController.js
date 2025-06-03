const scheduler = require('../utils/orderScheduler');
const notificationScheduler = require('../utils/scheduler');
exports.runCronJob = async (req,res) => {
    try {
        console.log("[Scheduler] Starting instant order assignment...");
        const responseOrder = await scheduler.assignInstantOrders();
        console.log("[Scheduler] Instant order assignment completed successfully.");
        console.log("[Scheduler] Starting scheduled notification check:");
        const responseNotification = await notificationScheduler.sendNotifications();
        console.log("[Scheduler] Scheduled notification check completed successfully.");
        res.status(200).json({
            success: true,
            message: "Instant order assignment completed successfully.",
            orderResponse: responseOrder,
            notificationResponse: responseNotification,
        });
    } catch (error) {
        console.error("[Scheduler] Error in runCronJob:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
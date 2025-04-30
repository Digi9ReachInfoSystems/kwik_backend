const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");

router.post("/send", notificationController.SendNotification);
router.post("/order-update", notificationController.OrderUpdates);
router.post("/coupon", notificationController.SendNotificationForCoupon);
router.post("/idle-cart", notificationController.SendNotificationForIdleCart);
router.post("/product-update", notificationController.ProductUpdates);
router.post(
  "/schedule-dynamic",
  notificationController.scheduleDynamicNotification
);
module.exports = router;

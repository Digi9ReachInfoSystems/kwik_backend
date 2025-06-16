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
router.post(
  "/schedule-dynamic-user",
  notificationController.scheduleDynamicNotificationUser
);

module.exports = router;

// {
// "user_ref":"684946936619de681c5d5fc5",
// "orderId":"684fb1a3c60bbdd2beef34f3"
// }

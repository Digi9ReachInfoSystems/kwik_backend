const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");

router.post("/createOrder", paymentController.createRazorpayOrder);
router.post("/checStatus", paymentController.checkPaymentStatus);
router.post("/verifyPayment", paymentController.verifyPayment);

module.exports = router;
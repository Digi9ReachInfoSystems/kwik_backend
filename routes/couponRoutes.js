const express = require("express");
const router = express.Router();

const couponController = require("../controller/couponController");

// Route to create a coupon
router.post("/create", couponController.createCoupon);

// Route to get all coupons
router.get("/", couponController.getAllCoupons);

// Route to get a single coupon by ID
router.get("/:id", couponController.getCouponById);

// Route to update a coupon
router.put("/:id", couponController.updateCoupon);

// Route to delete a coupon
router.delete("/:id", couponController.deleteCoupon);

// Route to validate a coupon
router.post("/validate", couponController.validateCoupon);

module.exports = router;

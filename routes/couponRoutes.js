const express = require("express");
const router = express.Router();

const couponController = require("../controller/couponController");

// Create a new coupon
router.post("/", couponController.createCoupon);

// Update a coupon by ID
router.put("/:id", couponController.updateCoupon);

// Delete a coupon by ID
router.delete("/:id", couponController.deleteCoupon);

// Get all coupons
router.get("/", couponController.getAllCoupons);

// Get a coupon by ID
router.get("/:id", couponController.getCouponById);

// Get coupons by type
router.get("/type/:type", couponController.getCouponsByType);

router.post("/apply/validate", couponController.validateCoupon);

router.get("/get/allCouponsGroupedByType", couponController.getAllCouponsGroupedByType);

module.exports = router;
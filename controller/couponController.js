const Coupon = require("../models/coupon_model"); // Import the Coupon model
const User = require("../models/user_models"); // Import the User model

// Create Coupon
exports.createCoupon = async (req, res) => {
  try {
    const { coupon_name, coupon_des, start_date, end_date, min_order_value, discount_price, coupon_image, coupon_type, user_list } = req.body;

    // Validate the required fields
    if (!coupon_name || !coupon_des || !start_date || !end_date || !min_order_value || !discount_price || !coupon_image || !coupon_type || !user_list) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create the new coupon
    const newCoupon = new Coupon({
      coupon_name,
      coupon_des,
      start_date,
      end_date,
      min_order_value,
      discount_price,
      coupon_image,
      coupon_type,
      user_list,
    });

    const savedCoupon = await newCoupon.save();
    res.status(201).json({ message: "Coupon created successfully", data: savedCoupon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating coupon", error: error.message });
  }
};

// Get All Coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching coupons", error: error.message });
  }
};

// Get Single Coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching coupon", error: error.message });
  }
};

// Update Coupon
exports.updateCoupon = async (req, res) => {
  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json({ message: "Coupon updated successfully", data: updatedCoupon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating coupon", error: error.message });
  }
};

// Delete Coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting coupon", error: error.message });
  }
};

// Validate Coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { coupon_code, userId, order_value } = req.body;

    // Validate the required fields
    if (!coupon_code || !userId || !order_value) {
      return res.status(400).json({ message: "Coupon code, user ID, and order value are required" });
    }

    // Find the coupon by code
    const coupon = await Coupon.findOne({ coupon_name: coupon_code });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Check if the coupon is still valid (check date range)
    const currentDate = new Date();
    if (currentDate < coupon.start_date || currentDate > coupon.end_date) {
      return res.status(400).json({ message: "Coupon is not valid at the moment" });
    }

    // Check if the order value meets the minimum requirement
    if (order_value < coupon.min_order_value) {
      return res.status(400).json({ message: "Order value does not meet the minimum requirement" });
    }

    // Check if the user is eligible for the coupon (based on coupon type and user list)
    if (coupon.coupon_type === "Selected users" && !coupon.user_list.includes(userId)) {
      return res.status(400).json({ message: "User is not eligible for this coupon" });
    }

    // Calculate discount
    const discountAmount = coupon.discount_price;
    res.status(200).json({ message: "Coupon is valid", discountAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error validating coupon", error: error.message });
  }
};

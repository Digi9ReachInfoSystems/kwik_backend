const Coupon = require("../models/coupon_model"); // Import the Coupon model
const User = require("../models/user_models"); // Import the User model
const Order = require("../models/order_model");

// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    console.dir(req.body, { depth: null });
    const newCoupon = new Coupon(req.body);
    await newCoupon.save();
    res.status(201).json({ success: true, message: "Coupon created successfully", data: newCoupon });
  } catch (error) {
    console.error("Error creating coupon: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update an existing coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, message: "Coupon updated successfully", data: updatedCoupon });
  } catch (error) {
    console.error("Error updating coupon: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all coupons
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    console.error("Error getting coupons: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    console.error("Error getting coupon by ID: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get coupons by type
exports.getCouponsByType = async (req, res) => {
  try {
    const { type } = req.params; // Type should be passed in the URL
    const coupons = await Coupon.find({ coupon_type: type });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    console.error("Error getting coupons by type: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { coupon_id, user_id } = req.body; // Type should be passed in the URL
    const user = await User.findOne({ UID: user_id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const coupons = await Coupon.findById(coupon_id);
    if (!coupons) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    if (coupons.coupon_type == "new user") {
      const orders = await Order.find({ user_ref: user._id });
      if (orders.length > 1) {
        return res.status(404).json({ success: false, message: "Coupon already used" });
      } else {
        if (coupons.start_date > new Date()) {
          return res.status(404).json({ success: false, message: "Coupon not active" });
        }
        if (coupons.end_date < new Date()) {
          return res.status(404).json({ success: false, message: "Coupon expired" });
        }
        let total_amount = 0;
        user.cart_products.forEach(element => {
          total_amount += element.final_price;
        })
        if (total_amount < coupons.min_order_value) {
          return res.status(404).json({ success: false, message: "Coupon not active" });
        }
        let discount_price = (total_amount / 100) * coupons.discount_percentage;
        if (discount_price > coupons.discount_max_price) {
          discount_price = coupons.discount_max_price;
        }
        return res.status(200).json({ success: true, data: { discount_price, total_amount } });

      }

    } else if ((coupons.coupon_type == "Selected users") || (coupons.coupon_type == "individual")) {
      if (!coupons.user_list.includes(user._id)) {
        return res.status(404).json({ success: false, message: "Coupon not active for this user" });
      } else {
        if (coupons.start_date > new Date()) {
          return res.status(404).json({ success: false, message: "Coupon not active" });
        }
        if (coupons.end_date < new Date()) {
          return res.status(404).json({ success: false, message: "Coupon expired" });
        }
        let total_amount = 0;
        user.cart_products.forEach(element => {
          total_amount += element.final_price;
        })
        if (total_amount < coupons.min_order_value) {
          return res.status(404).json({ success: false, message: "Coupon not active" });
        }
        let discount_price = (total_amount / 100) * coupons.discount_percentage;
        if (discount_price > coupons.discount_max_price) {
          discount_price = coupons.discount_max_price;
        }
        return res.status(200).json({ success: true, data: { discount_price, total_amount } });
      }
    } else if (coupons.coupon_type === "All" || coupons.coupon_type == "normal") {
      if (coupons.start_date > new Date()) {
        return res.status(404).json({ success: false, message: "Coupon not active" });
      }
      if (coupons.end_date < new Date()) {
        return res.status(404).json({ success: false, message: "Coupon expired" });
      }
      let total_amount = 0;
      user.cart_products.forEach(element => {
        total_amount += element.final_price;
      })
      if (total_amount < coupons.min_order_value) {
        return res.status(404).json({ success: false, message: "Coupon not active" });
      }
      let discount_price = (total_amount / 100) * coupons.discount_percentage;
      if (discount_price > coupons.discount_max_price) {
        discount_price = coupons.discount_max_price;
      }
      return res.status(200).json({ success: true, data: { discount_price, total_amount } });
    } else {
      return res.status(404).json({ success: false, message: "Coupon invalid" });
    }

  } catch (error) {
    console.error("Error getting coupons by type: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getAllCouponsGroupedByType = async (req, res) => {
  try {
    const All = await Coupon.find({ coupon_type: "All" })    ;
    const normal = await Coupon.find({ coupon_type: "normal" });
    const selected = await Coupon.find({ coupon_type: "Selected users" });
    const newuser = await Coupon.find({ coupon_type: "new user" });
    const individual = await Coupon.find({ coupon_type: "individual" });
    return res.status(200).json({ success: true, data: { All, normal, selected, newuser, individual } });
  } catch (error) {
    console.error("Error getting coupons by type: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
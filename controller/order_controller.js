const Order = require("../models/order_model"); 
const User = require("../models/user_models"); 
const Warehouse = require("../models/warehouse_model"); 
const CartProduct = require("../models/cart_product_model"); 
const Product = require("../models/product_model");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      pincode,
      user_ref,
      order_status,
      otp,
      order_placed_time,
      payment_type,
      total_amount,
      total_saved,
      discount_price,
      profit,
      payment_id,
      type_of_delivery,
      delivery_charge,
      selected_time_slot,
    } = req.body;

    // Validate if the warehouse and user exist
    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!warehouse) {
      return res.status(400).json({ success: false, message: "Warehouse not found" });
    }

    const userData = await User.findOne({ UID: user_ref });
    if (!userData) {
      return res.status(400).json({ success: false, message: "Invalid user reference" });
    }
 
   const  products= userData.cart_products;

    // Validate each product reference (optional: you can add extra validation for products)
    for (const product of products) {
      const productExists = await Product.exists({ _id: product.product_ref });
      if (!productExists) {
        return res.status(400).json({ success: false, message: `Product with ID ${product.product_ref} is invalid` });
      }
    }

    // Create a new order object
    const newOrder = new Order({
      warehouse_ref:warehouse._id,
      user_ref:userData._id,
      products,
      order_status,
      user_address:userData.selected_Address,
      user_contact_number:userData.phone,
      user_location:userData.selected_Address.Location,
      otp,
      order_placed_time,
      payment_type,
      total_amount,
      total_saved,
      discount_price,
      profit,
      payment_id,
      type_of_delivery,
      selected_time_slot,
      delivery_charge,
    });
    // If the order status is out for delivery or completed, you can add timestamps for those statuses
    if (order_status === "Out for delivery") {
      newOrder.out_for_delivery_time = new Date();
    } else if (order_status === "Delivered") {
      newOrder.completed_time = new Date();
    }

    // Save the new order to the database
    await newOrder.save();

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({ success: false, message: error.message });
  } 
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error getting order by ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getOrderByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({UID:userId}).sort({ createdAt: -1 });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const orders = await Order.find({ user_ref: user._id });
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error getting orders by user ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    updates.order_status=updates.order_status||order.order_status;
    updates.delivery_boy=updates.delivery_boy||order.delivery_boy;
    updates.out_for_delivery_time=updates.out_for_delivery_time||order.out_for_delivery_time;
    updates.completed_time=updates.completed_time||order.completed_time;
    updates.failed_time=updates.failed_time||order.failed_time;
    const updatedOrder = await Order.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, message: "Order updated successfully", data: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersByWarehouseId = async (req, res) => {
  try {
    const { pincode } = req.params;
    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!warehouse) {   
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }   
    const orders = await Order.find({ warehouse_ref: warehouse._id });
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders ,warehouse:warehouse});
  } catch (error) {
    console.error("Error getting orders by warehouse ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

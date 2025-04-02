const Order = require("../models/order_model");
const User = require("../models/user_models");
const Warehouse = require("../models/warehouse_model");
const CartProduct = require("../models/cart_product_model");
const Product = require("../models/product_model");
const mongoose = require("mongoose");
const moment = require("moment");

function getISOWeek(date) {
  const tempDate = new Date(date.getTime());
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      delivery_instructions,
      pincode,
      user_ref,
      order_status,
      otp,
      order_placed_time,
      payment_type,
      discount_price,
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

    const products = userData.cart_products;
    let total_amount = 0;
    let total_saved = 0;
    let profit = 0;

    // Validate each product reference (optional: you can add extra validation for products)
    for (const product of products) {
      const productExists = await Product.exists({ _id: product.product_ref });
      if (!productExists) {
        return res.status(400).json({ success: false, message: `Product with ID ${product.product_ref} is invalid` });
      }
      total_amount += Number(product.selling_price * product.quantity);
      total_saved += Number(product.mrp * product.quantity) - Number(product.selling_price * product.quantity);
      profit += Number(product.selling_price * product.quantity) - Number(product.buying_price * product.quantity);
    }
    profit -= discount_price;
    // Create a new order object
    const newOrder = new Order({
      warehouse_ref: warehouse._id,
      user_ref: userData._id,
      products,
      order_status,
      user_address: userData.selected_Address,
      user_contact_number: userData.phone,
      user_location: userData.selected_Address.Location,
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
      delivery_instructions
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
    const orders = await Order.find().sort({ createdAt: -1 })
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
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
    const user = await User.findOne({ UID: userId }).sort({ createdAt: -1 });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const orders = await Order.find({ user_ref: user._id })
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
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
    updates.order_status = updates.order_status || order.order_status;
    updates.delivery_boy = updates.delivery_boy || order.delivery_boy;
    updates.out_for_delivery_time = updates.out_for_delivery_time || order.out_for_delivery_time;
    updates.completed_time = updates.completed_time || order.completed_time;
    updates.failed_time = updates.failed_time || order.failed_time;
    updates.packing_time = updates.packing_time || order.packing_time;
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

exports.getOrdersByWarehouse = async (req, res) => {
  try {
    const { pincode } = req.params;
    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    const orders = await Order.find({ warehouse_ref: warehouse._id })
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders, warehouse: warehouse });
  } catch (error) {
    console.error("Error getting orders by warehouse ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWeeklyOrdersByMonthAndYear = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and Year are required' });
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ success: false, message: 'Invalid month value. It should be between 1 and 12.' });
    }

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 1);
    startDate.setDate(startDate.getDate() + 1);

    let weeklyCounts = [];

    const totalDays = (endDate - startDate) / (1000 * 3600 * 24);
    const weeksInMonth = Math.ceil(totalDays / 7);
    let maxOrderCount = 0;

    for (let week = 0; week < weeksInMonth; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + week * 7);
      const weekEnd = new Date(startDate);
      weekEnd.setDate(startDate.getDate() + (week + 1) * 7 - 1);


      if (weekEnd > endDate) {
        weekEnd.setDate(endDate.getDate());
      }
      const orders = await Order.find({
        completed_time: { $gte: weekStart, $lte: weekEnd },
        order_status: 'Delivered',
      }).exec();
      if (orders.length > maxOrderCount) {
        maxOrderCount = orders.length;
      }

      weeklyCounts.push({
        week: week + 1,
        startDate: weekStart,
        endDate: weekEnd,
        orderCount: orders.length,
      });
    }

    res.status(200).json({ success: true, data: weeklyCounts, maxOrderCount: maxOrderCount });
  } catch (error) {
    console.error('Error fetching weekly orders by month and year:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getMonthlyRevenueByYear = async (req, res) => {
  try {
    const { year, warehouseId } = req.query;
    const startDate = new Date(year, 0, 1);  // Start of the year
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);  // End of the year
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    const orders = await Order.find({
      completed_time: { $gte: startDate, $lte: endDate },
      order_status: 'Delivered',
      warehouse_ref: warehouse._id
    }).exec();
    let total_amount = 0;
    let maxAmount = 0;

    const monthlyRevenue = Array(12).fill(0);

    orders.forEach(order => {
      const month = order.completed_time.getMonth();
      monthlyRevenue[month] += order.total_amount;
      total_amount += order.total_amount

    });
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const responseData = monthlyRevenue.map((revenue, index) => {
      if (revenue > maxAmount) {
        maxAmount = revenue;
      }
      return ({
        month: months[index],
        revenue: revenue
      })
    });


    res.status(200).json({ success: true, data: responseData, total_Revenue: total_amount, MaxAmount: (maxAmount * 1.2) });
  } catch (error) {
    console.error('Error fetching monthly revenue by year:', error);
    res.status(500).json({ success: false, message: 'Error fetching data' });
  }
};

exports.getOrderByWarehouseAndStatus = async (req, res) => {
  try {
    const { warehouse_id, order_status } = req.params;
    const orders = await Order.find({ warehouse_ref: warehouse_id, order_status: order_status })
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders by warehouse ID and status:', error);
    res.status(500).json({ success: false, message: 'Error fetching data' });
  }
}

exports.getOrdersByWarehouseId = async (req, res) => {
  try {
    const { warehouse_id } = req.params;
    const warehouse = await Warehouse.findById(warehouse_id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    const orders = await Order.find({ warehouse_ref: warehouse._id })
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error getting orders by warehouse ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOrderById = async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const order = await Order.findByIdAndDelete(id)
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, message: "Order deleted successfully", data: order });
  } catch (error) {
    console.error("Error deleting order by ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getDeliveredOrderByWarehouseId = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    if (!warehouseId) {
      return res.status(400).json({ success: false, message: "warehouseId is required" });
    }
    const orders = await Order.find({ warehouse_ref: warehouseId, order_status: "Delivered" }).populate("warehouse_ref user_ref products.product_ref").exec();
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.find({ order_status: status })
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error getting orders by status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderStatsByWareHouseYear = async (req, res) => {
  try {
    const { warehouseId, year, month } = req.query;

    if (!warehouseId || !year) {
      return res.status(400).json({ success: false, message: "Warehouse ID and year are required" });
    }


    const query = {
      warehouse_ref: warehouseId,
      order_status: "Delivered",
      order_placed_time: {
        $gte: new Date(`${year}-01-01T00:00:00Z`),
        $lt: new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`),  // Start of the next year
      },
    };

    if (month) {

      if (parseInt(month) < 1 || parseInt(month) > 12) {
        return res.status(400).json({ success: false, message: "Invalid month. Please provide a month between 1 and 12." });
      }

      const startOfMonth = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`); // Ensure two-digit month
      const endOfMonth = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      if (isNaN(startOfMonth) || isNaN(endOfMonth)) {
        return res.status(400).json({ success: false, message: "Invalid date provided for the month." });
      }

      query.order_placed_time = { $gte: startOfMonth, $lt: endOfMonth };
    }

    const result1 = await Order.find(
      query,
    )
    let groupBy = month ? { $dayOfMonth: "$order_placed_time" } : { $month: "$order_placed_time" };
    // const result = await Order.aggregate([
    //   // {
    //   //   $match:
    //   //     query,
    //   // },
    //   {
    //     $group: {
    //       _id: groupBy,
    //       totalAmount: { $sum: "$total_amount" },
    //       totalProfit: { $sum: "$profit" },
    //     },
    //   },
    //   {
    //     $sort: { _id: 1 },
    //   },
    // ]);
    const aggregatedResult = result1.reduce((acc, order) => {
      let key;
      if (month) {
        key = new Date(order.order_placed_time).getDate();
      } else {
        key = new Date(order.order_placed_time).getMonth() + 1;  // JavaScript months are 0-indexed
      }

      if (!acc[key]) {
        acc[key] = {
          totalAmount: 0,
          totalProfit: 0,
        };
      }

      acc[key].totalAmount += order.total_amount;
      acc[key].totalProfit += order.profit;

      return acc;
    }, {});
    const result = [];
    let maxTotalAmount = 0;
    let maxTotalProfit = 0;
    if (month) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        if (aggregatedResult[i]?.totalAmount > maxTotalAmount) {
          maxTotalAmount = aggregatedResult[i]?.totalAmount;
        }
        if (aggregatedResult[i]?.totalProfit > maxTotalProfit) {
          maxTotalProfit = aggregatedResult[i]?.totalProfit;
        }
        result.push({
          _id: i,
          totalAmount: aggregatedResult[i]?.totalAmount || 0,
          totalProfit: aggregatedResult[i]?.totalProfit || 0,
        });
      }
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 1; i <= 12; i++) {
        if (aggregatedResult[i]?.totalAmount > maxTotalAmount) {
          maxTotalAmount = aggregatedResult[i]?.totalAmount;
        }
        if (aggregatedResult[i]?.totalProfit > maxTotalProfit) {
          maxTotalProfit = aggregatedResult[i]?.totalProfit;
        }
        result.push({
          _id: i,
          month: months[i - 1],
          totalAmount: aggregatedResult[i]?.totalAmount || 0,
          totalProfit: aggregatedResult[i]?.totalProfit || 0,
        });
      }
    }
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false, message: "No orders found for the given criteria",
        data: result,
        maxXAxis: maxTotalAmount > maxTotalProfit ? (maxTotalAmount + (maxTotalAmount * 0.2)) : (maxTotalProfit + (maxTotalProfit * 0.2)),
        maxYAxis: month ? result[result.length - 1]._id : 12,
      });
    }

    return res.status(200).json({
      success: true,
      maxXAxis: maxTotalAmount > maxTotalProfit ? (maxTotalAmount + (maxTotalAmount * 0.2)) : (maxTotalProfit + (maxTotalProfit * 0.2)),
      maxYAxis: month ? result[result.length - 1]._id : 12,
      data: result,
    });

  } catch (error) {
    console.error("Error fetching order stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getOrderStatsByYear = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year) {
      return res.status(400).json({ success: false, message: "year is  required" });
    }


    const query = {
      // warehouse_ref: warehouseId,
      order_status: "Delivered",
      order_placed_time: {
        $gte: new Date(`${year}-01-01T00:00:00Z`),
        $lt: new Date(`${parseInt(year) + 1}-01-01T00:00:00Z`),  // Start of the next year
      },
    };

    if (month) {

      if (parseInt(month) < 1 || parseInt(month) > 12) {
        return res.status(400).json({ success: false, message: "Invalid month. Please provide a month between 1 and 12." });
      }

      const startOfMonth = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`); // Ensure two-digit month
      const endOfMonth = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      if (isNaN(startOfMonth) || isNaN(endOfMonth)) {
        return res.status(400).json({ success: false, message: "Invalid date provided for the month." });
      }

      query.order_placed_time = { $gte: startOfMonth, $lt: endOfMonth };
    }

    const result1 = await Order.find(
      query,
    )
    let groupBy = month ? { $dayOfMonth: "$order_placed_time" } : { $month: "$order_placed_time" };
    // const result = await Order.aggregate([
    //   // {
    //   //   $match:
    //   //     query,
    //   // },
    //   {
    //     $group: {
    //       _id: groupBy,
    //       totalAmount: { $sum: "$total_amount" },
    //       totalProfit: { $sum: "$profit" },
    //     },
    //   },
    //   {
    //     $sort: { _id: 1 },
    //   },
    // ]);
    const aggregatedResult = result1.reduce((acc, order) => {
      let key;
      if (month) {
        key = new Date(order.order_placed_time).getDate();
      } else {
        key = new Date(order.order_placed_time).getMonth() + 1;  // JavaScript months are 0-indexed
      }

      if (!acc[key]) {
        acc[key] = {
          totalAmount: 0,
          totalProfit: 0,
        };
      }

      acc[key].totalAmount += order.total_amount;
      acc[key].totalProfit += order.profit;

      return acc;
    }, {});
    const result = [];
    let maxTotalAmount = 0;
    let maxTotalProfit = 0;
    if (month) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        if (aggregatedResult[i]?.totalAmount > maxTotalAmount) {
          maxTotalAmount = aggregatedResult[i]?.totalAmount;
        }
        if (aggregatedResult[i]?.totalProfit > maxTotalProfit) {
          maxTotalProfit = aggregatedResult[i]?.totalProfit;
        }
        result.push({
          _id: i,
          totalAmount: aggregatedResult[i]?.totalAmount || 0,
          totalProfit: aggregatedResult[i]?.totalProfit || 0,
        });
      }
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 1; i <= 12; i++) {
        if (aggregatedResult[i]?.totalAmount > maxTotalAmount) {
          maxTotalAmount = aggregatedResult[i]?.totalAmount;
        }
        if (aggregatedResult[i]?.totalProfit > maxTotalProfit) {
          maxTotalProfit = aggregatedResult[i]?.totalProfit;
        }
        result.push({
          _id: i,
          month: months[i - 1],
          totalAmount: aggregatedResult[i]?.totalAmount || 0,
          totalProfit: aggregatedResult[i]?.totalProfit || 0,
        });
      }
    }
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false, message: "No orders found for the given criteria",
        data: result,
        maxXAxis: maxTotalAmount > maxTotalProfit ? (maxTotalAmount + (maxTotalAmount * 0.2)) : (maxTotalProfit + (maxTotalProfit * 0.2)),
        maxYAxis: month ? result[result.length - 1]._id : 12,
      });
    }

    return res.status(200).json({
      success: true,
      maxXAxis: maxTotalAmount > maxTotalProfit ? (maxTotalAmount + (maxTotalAmount * 0.2)) : (maxTotalProfit + (maxTotalProfit * 0.2)),
      maxYAxis: month ? result[result.length - 1]._id : 12,
      data: result,
    });

  } catch (error) {
    console.error("Error fetching order stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getWeeklyDeliveredOrderCount = async (req, res) => {
  const { year, month, warehouseId } = req.query;
  try {
    const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`);
    const endDate = new Date(year, month, 1);
    const totalWeeks = Math.ceil((endDate.getDate() - startDate.getDate() + 1) / 7);
    console.log("totalWeeks",);
    const pipeline = [
      {
        $match: {
          order_status: "Delivered",
          order_placed_time: {
            $gte: startDate,
            $lt: endDate,
          },
          ...(warehouseId && { warehouse_ref: new mongoose.Types.ObjectId(warehouseId) }),
        },
      },
      {
        $project: {
          week: { $isoWeek: "$order_placed_time" },
        },
      },
      {
        $group: {
          _id: "$week",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          week: "$_id",
          count: 1,
        },
      },
    ];


    const result = await Order.aggregate(pipeline);


    let weekCounts = [];
    let maxXAxis = 0;
    for (let i = getISOWeek(startDate), j = 1; i <= getISOWeek(endDate); i++, j++) {
      const weekData = result.find((item) => item.week === i);
      if (weekData && weekData.count > maxXAxis) {
        maxXAxis = weekData.count;
      }
      weekCounts.push({ week: j, count: weekData ? weekData.count : 0 });
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: "No orders found for the given criteria", data: weekCounts });
    }

    return res.status(200).json({ success: true, maxXAxis: (maxXAxis + 5), maxYAxis: weekCounts[weekCounts.length - 1].week, data: weekCounts, });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

exports.searchOrderBycustomerName = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const users = await User.find({ displayName: { $regex: `^${name}`, $options: "i" } });
    if (!users) {
      return res.status(404).json({ sucess: false, message: "Users not found" });
    }
    const userIds = users.map(user => user._id);
    const orders = await Order.find({ user_ref: { $in: userIds } }).populate('user_ref', 'displayName');

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "No Orders found", data: orders });
    }

    return res.status(200).json({ success: true, message: "orders retrieved successfully", data: orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.searchOrderByWarehouseCustomerName = async (req, res) => {
  const { name } = req.query;
  const { warehouseId } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const users = await User.find({ displayName: { $regex: `^${name}`, $options: "i" } });
    if (!users) {
      return res.status(404).json({ sucess: false, message: "Users not found" });
    }
    const userIds = users.map(user => user._id);
    const orders = await Order.find({ user_ref: { $in: userIds }, warehouse_ref: warehouseId }).populate('user_ref', 'displayName');

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "No Orders found", data: orders });
    }

    return res.status(200).json({ success: true, message: "orders retrieved successfully", data: orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMonthlyRevenueByYearAdmin = async (req, res) => {
  try {
    const { year } = req.query;
    const startDate = new Date(year, 0, 1);  // Start of the year
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);  // End of the year

    const orders = await Order.find({
      completed_time: { $gte: startDate, $lte: endDate },
      order_status: 'Delivered',
    }).exec();
    let total_amount = 0;
    let maxAmount = 0;

    const monthlyRevenue = Array(12).fill(0);

    orders.forEach(order => {
      const month = order.completed_time.getMonth();
      monthlyRevenue[month] += order.total_amount;
      total_amount += order.total_amount

    });
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const responseData = monthlyRevenue.map((revenue, index) => {
      if (revenue > maxAmount) {
        maxAmount = revenue;
      }
      return ({
        month: months[index],
        revenue: revenue
      })
    });


    res.status(200).json({ success: true, data: responseData, total_Revenue: total_amount, MaxAmount: (maxAmount * 1.2) });
  } catch (error) {
    console.error('Error fetching monthly revenue by year:', error);
    res.status(500).json({ success: false, message: 'Error fetching data' });
  }
};


exports.getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_time: -1 }).limit(10)
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
exports.getMonthlyOrderCount = async (req, res) => {
  try {
    const { year, warehouseId } = req.query;
    const filter = {};
    if (!year) {
      return res.status(400).json({ success: false, message: "Year is required" });
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    filter.order_placed_time = { $gte: startDate, $lte: endDate };
    if (warehouseId) {
      filter.warehouse_ref = warehouseId
    }
    filter.order_status = 'Delivered';

    const orders = await Order.find(filter).exec();
    const orderCounts = new Array(12).fill(0);
    const finalOrders = [];

    orders.forEach(order => {
      const month = order.created_time.getMonth();
      orderCounts[month]++;
    });

    for (let i = 0; i < orderCounts.length; i++) {
      finalOrders.push({
        month: i + 1,
        count: orderCounts[i]
      });
    }

    res.status(200).json({ success: true, data: finalOrders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTopSellingProducts = async (req, res) => {
  try {
    // 1. Extract warehouseId and year from query (or body/params if you prefer)
    const { warehouseId } = req.query;

    if (!warehouseId) {
      return res
        .status(400)
        .json({ message: "Missing warehouseId or year in request query" });
    }

    // const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
    // const endOfYear = new Date(`${year}-12-31T23:59:59Z`);

    const warehouseObjectId = new mongoose.Types.ObjectId(warehouseId);
    const topProducts = await Order.aggregate([
      {
        $match: {
          warehouse_ref: warehouseObjectId,
        },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product_ref",
          totalSold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",            // MongoDB collection name for Product
          localField: "_id",           // _id from the group (product_ref)
          foreignField: "_id",         // matches Product's _id
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          totalSold: 1,
          productDetails: {
            _id: 1,
            product_name: 1,
            product_des: 1,
            product_image: 1,
          },
        },
      },
    ]);

    // 5. Return the result
    return res.status(200).json({
      message: "Top 10 selling products retrieved successfully",
      data: topProducts,
    });
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return res
      .status(500)
      .json({ message: "Error fetching top selling products", error: error.message });
  }
};

exports.getRecentOrdersBywarehouseId = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    const orders = await Order.find({ warehouse_ref: warehouse._id }).sort({ created_time: -1 }).limit(10)
      .populate("warehouse_ref user_ref products.product_ref delivery_boy")
      .exec();
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
exports.searchOrderBycustomerNameStatus = async (req, res) => {
  const { name } = req.query;
  const { status, warehouseId } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const users = await User.find({ displayName: { $regex: `^${name}`, $options: "i" } });
    if (!users) {
      return res.status(404).json({ sucess: false, message: "Users not found" });
    }
    const userIds = users.map(user => user._id);
    const orders = await Order.find({ user_ref: { $in: userIds }, order_status: status, warehouse_ref: warehouseId }).populate('user_ref', 'displayName');

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "No Orders found", data: orders });
    }

    return res.status(200).json({ success: true, message: "orders retrieved successfully", data: orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getOrdersByWarehouseByTypeOfDelivery = async (req, res) => {
  try {
    const { time } = req.query;
    const { warehouseId, delivery_type } = req.params;

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    let timeFilter;

    if (time != 'null') {
      // If time is passed, set the time range for that specific hour
      timeFilter = {
        $match: {
          selected_time_slot: {
            $gte: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").startOf('hour').local().toDate(),
            $lt: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").endOf('hour').local().toDate(),
          },
        },
      };
    } else {
      console.log("hello");
      timeFilter = {
        $match: {
          selected_time_slot: {
            $gte: moment().startOf('day').local().toDate(),  // Start of the current day (00:00 AM)
            $lt: moment().endOf('day').local().toDate(),    // End of the current day (11:59 PM)
          },
        },
      };
    }
    const orders = await Order.aggregate([
      // Match by user, warehouse, delivery type
      {
        $match: {
          // user_ref: { $in: userIds },
          warehouse_ref:new  mongoose.Types.ObjectId(warehouseId),
          type_of_delivery: delivery_type,
          order_status: "Order placed",
        },
      },
      // Apply time filter
      timeFilter,
      // Count how many products are in each order
      {
        $addFields: {
          numberOfProducts: { $size: "$products" },
        },
      },
      // Lookup the "Product" documents associated to each product_ref
      {
        $lookup: {
          from: "products",
          localField: "products.product_ref", // Field(s) in this Order doc
          foreignField: "_id",                // Field in the Product collection
          as: "populatedProducts",            // Temporarily store them here
        },
      },
      // Lookup to populate warehouse_ref from Warehouse collection
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouse_ref",        // Reference to warehouse
          foreignField: "_id",                // Match on warehouse _id
          as: "warehouse_ref",                // Store result here
        },
      },
      // Lookup to populate user_ref from User collection
      {
        $lookup: {
          from: "users",
          localField: "user_ref",             // Reference to user
          foreignField: "_id",                // Match on user _id
          as: "user_ref",                     // Store result here
        },
      },
      // Re-map the products array so each product_ref is a single Product doc
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "oneProduct",
              in: {
                $mergeObjects: [
                  // Keep all original fields in "oneProduct"
                  "$$oneProduct",
                  // Overwrite product_ref with the fully populated doc
                  {
                    product_ref: {
                      // $arrayElemAt with $filter ensures we get a single matching doc
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$populatedProducts",
                            as: "popProd",
                            cond: { $eq: ["$$oneProduct.product_ref", "$$popProd._id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      // We no longer need "populatedProducts" after merging
      {
        $project: {
          populatedProducts: 0,
        },
      },
      // Optionally, you can include other fields in your projection
      {
        $project: {
          warehouse_ref: 1,
          user_ref: 1,
          products: 1,
          delivery_boy: 1,
          order_status: 1,
          user_address: 1,
          user_contact_number: 1,
          user_location: 1,
          otp: 1,
          order_placed_time: 1,
          out_for_delivery_time: 1,
          packing_time: 1,
          completed_time: 1,
          failed_time: 1,
          payment_type: 1,
          total_amount: 1,
          total_saved: 1,
          discount_price: 1,
          profit: 1,
          payment_id: 1,
          type_of_delivery: 1,
          selected_time_slot: 1,
          delivery_charge: 1,
          delivery_instructions: 1,
          created_time: 1,
          numberOfProducts: 1,
        },
      },
    ]);
    console.log(orders);
    if (!orders) {
      return res.status(404).json({ success: false, message: "Orders not found" });
    }
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error getting orders by warehouse ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
exports.searchOrdersByWarehouseByTypeOfDelivery = async (req, res) => {
  const { name, time } = req.query;
  const { warehouseId, delivery_type } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }
  let timeFilter;

  if (time != 'null') {
    // If time is passed, set the time range for that specific hour
    timeFilter = {
      $match: {
        selected_time_slot: {
          $gte: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").startOf('hour').local().toDate(),
          $lt: moment(`${moment().format('YYYY-MM-DD')} ${time}`, "YYYY-MM-DD h:mm A").endOf('hour').local().toDate(),
        },
      },
    };
  } else {
    timeFilter = {
      $match: {
        selected_time_slot: {
          $gte: moment().startOf('day').local().toDate(),  // Start of the current day (00:00 AM)
          $lt: moment().endOf('day').local().toDate(),    // End of the current day (11:59 PM)
        },
      },
    };
  }
  console.log(timeFilter);
  try {
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    const users = await User.find({ displayName: { $regex: `^${name}`, $options: "i" } });
    if (!users) {
      return res.status(404).json({ sucess: false, message: "Users not found" });
    }
    const userIds = users.map(user => user._id);
    // let orders = await Order.find({ user_ref: { $in: userIds }, warehouse_ref: warehouseId, type_of_delivery: delivery_type }).populate('user_ref', 'displayName');
    // if (orders.length === 0) {
    //   return res.status(404).json({ success: false, message: "No Orders found", data: orders });
    // }
    const orders = await Order.aggregate([
      // Match by user, warehouse, delivery type
      {
        $match: {
          user_ref: { $in: userIds },
          warehouse_ref:new  mongoose.Types.ObjectId(warehouseId),
          type_of_delivery: delivery_type,
          order_status: "Order placed",
        },
      },
      // Apply time filter
      timeFilter,
      // Count how many products are in each order
      {
        $addFields: {
          numberOfProducts: { $size: "$products" },
        },
      },
      // Lookup the "Product" documents associated to each product_ref
      {
        $lookup: {
          from: "products",
          localField: "products.product_ref", // Field(s) in this Order doc
          foreignField: "_id",                // Field in the Product collection
          as: "populatedProducts",            // Temporarily store them here
        },
      },
      // Lookup to populate warehouse_ref from Warehouse collection
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouse_ref",        // Reference to warehouse
          foreignField: "_id",                // Match on warehouse _id
          as: "warehouse_ref",                // Store result here
        },
      },
      // Lookup to populate user_ref from User collection
      {
        $lookup: {
          from: "users",
          localField: "user_ref",             // Reference to user
          foreignField: "_id",                // Match on user _id
          as: "user_ref",                     // Store result here
        },
      },
      // Re-map the products array so each product_ref is a single Product doc
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "oneProduct",
              in: {
                $mergeObjects: [
                  // Keep all original fields in "oneProduct"
                  "$$oneProduct",
                  // Overwrite product_ref with the fully populated doc
                  {
                    product_ref: {
                      // $arrayElemAt with $filter ensures we get a single matching doc
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$populatedProducts",
                            as: "popProd",
                            cond: { $eq: ["$$oneProduct.product_ref", "$$popProd._id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      // We no longer need "populatedProducts" after merging
      {
        $project: {
          populatedProducts: 0,
        },
      },
      // Optionally, you can include other fields in your projection
      {
        $project: {
          warehouse_ref: 1,
          user_ref: 1,
          products: 1,
          delivery_boy: 1,
          order_status: 1,
          user_address: 1,
          user_contact_number: 1,
          user_location: 1,
          otp: 1,
          order_placed_time: 1,
          out_for_delivery_time: 1,
          packing_time: 1,
          completed_time: 1,
          failed_time: 1,
          payment_type: 1,
          total_amount: 1,
          total_saved: 1,
          discount_price: 1,
          profit: 1,
          payment_id: 1,
          type_of_delivery: 1,
          selected_time_slot: 1,
          delivery_charge: 1,
          delivery_instructions: 1,
          created_time: 1,
          numberOfProducts: 1,
        },
      },
    ]);

    return res.status(200).json({ success: true, message: "orders retrieved successfully", data: orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
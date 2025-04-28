const Warehouse = require("../models/warehouse_model"); // Adjust the path as per your structure
const User = require("../models/user_models");
const Orders = require("../models/order_model");
const axios = require("axios");
const mongoose = require("mongoose");
const Product = require("../models/product_model");
const ApplicationManagement = require("../models/applicationManagementModel");
// Get all warehouses
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isDeleted: false })
      .populate("deliveryboys")
      .exec();
    res
      .status(200)
      .json({ message: "Warehouses retrieved successfully", data: warehouses });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching warehouses", error: error.message });
  }
};

// Add a new warehouse
exports.addWarehouse = async (req, res) => {
  try {
    const {
      UID,
      warehouse_id,
      warehouse_name,
      warehouse_des,
      warehouse_image,
      warehouse_number,
      picode,
      manager_name,
      manager_number,
      manager_email,
      warehouse_email,
      warehouse_password,
      deliveryboys,
      warehouse_location,
      warehouse_address,
      tum_tumdelivery_start_time,
      tumtumdelivery_end_time,
    } = req.body;

    // Validate required fields
    if (
      !UID ||
      !warehouse_id ||
      !warehouse_name ||
      !warehouse_des ||
      !warehouse_image ||
      !warehouse_number ||
      !picode ||
      !manager_name ||
      !manager_number ||
      !manager_email ||
      !warehouse_email ||
      !warehouse_password ||
      !warehouse_location ||
      !warehouse_address
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newWarehouse = new Warehouse({
      UID,
      warehouse_id,
      warehouse_name,
      warehouse_des,
      warehouse_image,
      warehouse_number,
      picode,
      manager_name,
      manager_number,
      manager_email,
      warehouse_email,
      warehouse_password,
      deliveryboys,
      warehouse_location,
      warehouse_address,
      tum_tumdelivery_start_time,
      tumtumdelivery_end_time,
    });

    const savedWarehouse = await newWarehouse.save();

    res
      .status(201)
      .json({ message: "Warehouse added successfully", data: savedWarehouse });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding warehouse", error: error.message });
  }
};

// Edit an existing warehouse
exports.editWarehouse = async (req, res) => {
  try {
    const warehouseId = req.params.id; // MongoDB Object ID of the warehouse to edit
    const updatedData = req.body;
    console.dir(updatedData, { depth: null });

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      warehouseId,
      updatedData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run validation on updated fields
      }
    );

    if (!updatedWarehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res
      .status(200)
      .json({
        message: "Warehouse updated successfully",
        data: updatedWarehouse,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating warehouse", error: error.message });
  }
};

// Delete a warehouse
exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouseId = req.params.id; // MongoDB Object ID of the warehouse to delete

    const deletedWarehouse = await Warehouse.findByIdAndDelete(warehouseId);

    if (!deletedWarehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res
      .status(200)
      .json({
        message: "Warehouse deleted successfully",
        data: deletedWarehouse,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting warehouse", error: error.message });
  }
};
exports.getWarehouseId = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await Warehouse.findOne({ _id: id, isDeleted: false })
      .populate("deliveryboys")
      .exec();
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.status(200).json({ message: "Warehouse found", data: warehouse });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching warehouse", error: error.message });
  }
};

exports.addDeliveryBoys = async (req, res) => {
  try {
    const { user_id, warehouse_id } = req.body;
    const user = await User.findOne({ UID: user_id });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const warehouse = await Warehouse.findById(warehouse_id).exec();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    if (warehouse.deliveryboys.some((deliveryboy) => deliveryboy._id.toString() === user._id.toString())) {
      res.status(500).json({ success: false, message: "Delivery boy already added", error: "Delivery boy already added" });
    }
    warehouse.deliveryboys.push(user._id);
    await warehouse.save();
    res.status(200).json({ success: true, message: "Delivery boy added successfully", warehouse: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding delivery boy", error: error.message });
  }
}

exports.getDeliveryBoysStats = async (req, res) => {
  try {
    const { pincode } = req.query;
    console.log("pincode", pincode);
    let warehouse;
    if (pincode) {
      warehouse = await Warehouse.find({ picode: pincode, isDeleted: false }).exec();
    } else {
      warehouse = await Warehouse.find().exec();
    }

    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    const data = warehouse.map((warehouse) => {
      return {
        warehouse_id: warehouse._id,
        warehouse_name: warehouse.warehouse_name,
        delivery_boys: warehouse.deliveryboys.length
      }
    })
    res.status(200).json({ success: true, message: "Delivery boys stats fetched successfully", warehouse: data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching delivery boys stats", error: error.message });
  }
}
exports.getWarehouseByUID = async (req, res) => {
  try {
    const { UID } = req.params;
    const warehouse = await Warehouse.findOne({ UID: UID, isDeleted: false })
      .populate("deliveryboys")
      .exec();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    res.status(200).json({ success: true, message: "Warehouse found", warehouse: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching warehouse", error: error.message });
  }
}

//  numberof user  pincode,total orders total delivered order,total revenue,number of delivery boys

exports.getWarehouseStats = async (req, res) => {
  try {
    const { id } = req.query;
    console.log("query ", req.query);
    let warehouse;
    if (id) {
      warehouse = await Warehouse.find({ _id: id, isDeleted: false }).exec();

    } else {
      warehouse = await Warehouse.find().exec();
    }
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    // console.log("warehouse", warehouse);
    let main_delivery_boys = 0;
    let main_total_orders = 0;
    let main_total_failed = 0
    let main_total_amount = 0;
    let main_total_profit = 0;
    let main_total_delivered = 0;
    let main_total_users = 0;

    let final_data = [];
    await Promise.all(warehouse.map(async (warehouse) => {
      const users = await User.find({ "selected_Address.pincode": warehouse.picode, isUser: true }).exec();
      let total_users = users.length;
      let delivery_boys = warehouse.deliveryboys.length;
      const orders = await Orders.find({ warehouse_ref: warehouse._id }).exec();
      let total_orders = orders.length;
      let total_delivered = orders.filter((order) => order.order_status === "Delivered").length;
      let total_failed = orders.filter((order) => order.order_status === "Delivery failed").length;
      let total_amount = 0;
      orders.map((order) => {
        if (order.order_status === "Delivered")
          total_amount += order.total_amount
      }

      );
      let total_profit = 0;
      orders.map((order) => {
        if (order.order_status === "Delivered")
          total_profit += order.profit
      });
      const data = {
        warehouse_id: warehouse._id,
        warehouse_name: warehouse.warehouse_name,
        delivery_boys: delivery_boys,
        total_orders: total_orders,
        total_delivered: total_delivered,
        total_amount: total_amount,
        total_profit: total_profit,
        total_failed: total_failed,
      }
      main_total_delivered += total_delivered;
      main_delivery_boys += delivery_boys;
      main_total_orders += total_orders;
      main_total_failed += total_failed;
      main_total_amount += total_amount;
      main_total_profit += total_profit;
      main_total_users += total_users;
      final_data.push(data);
    }))
    // console.log("final_data", final_data);
    res.status(200).json({
      success: true,
      message: "Warehouse stats fetched successfully",
      total_users: main_total_users,
      total_delivery_boys: main_delivery_boys,
      total_delivered: main_total_delivered,
      total_orders: main_total_orders,
      total_failed: main_total_failed,
      total_amount: main_total_amount,
      total_profit: main_total_profit,
      warehouse: final_data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching warehouse stats", error: error.message });
  }
}
exports.searchWarehouse = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    const warehouses = await Warehouse.find({
      warehouse_name: { $regex: `${name}`, $options: "i" },
      isDeleted: false
    })
      .populate("deliveryboys")
      .exec();

    if (warehouses.length === 0) {
      return res.status(404).json({ success: false, message: "No Warehouse found", data: warehouses });
    }

    return res.status(200).json({ success: true, message: "Warehouses retrieved successfully", data: warehouses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getWarehouseStatus = async (req, res) => {
  try {
    const { pincode } = req.params;
    const warehouse = await Warehouse.findOne({ picode: pincode, isDeleted: false })
      .populate("deliveryboys")
      .exec();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    res.status(200).json({ success: true, message: "Warehouse found", warehouse: warehouse, maintance_status: warehouse.under_maintance });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching warehouse", error: error.message });
  }
}
exports.searchUserByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { name } = req.query;
    const warehouse = await Warehouse.findOne({ _id: warehouseId, isDeleted: false })
      .populate("deliveryboys")
      .exec();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    const users = await User.find({
      current_pincode: { $in: warehouse.picode },
      isUser: true,
      displayName: { $regex: `${name}`, $options: "i" }
    }).exec();
    const orderDetails = await Promise.all(users.map(async (user) => {

      const orders = await Orders.find({ warehouse_ref: new mongoose.Types.ObjectId(warehouseId), user_ref: user._id }).exec();
      return {
        user: user,
        orders: orders,
        numberOfOrders: orders.length,
      };
    }))

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found in the warehouse" });
    }
    res.status(200).json({ success: true, message: "Users retrieved successfully", orderDetails: orderDetails });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });

  }
};
exports.getWarehousesBypincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    const warehouses = await Warehouse.find({ picode: pincode, isDeleted: false })
      .populate("deliveryboys")
      .exec();
    if (!warehouses) {
      return res.status(404).json({ success: false, message: "Warehouses not found" });
    }
    res.status(200).json({ success: true, message: "Warehouses retrieved successfully", warehouses: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching warehouses", error: error.message });
  }
};
exports.getDeliveryServiceStatus = async (req, res) => {
  try {
    const { pincode, destinationLat, destinationLon } = req.body;
    const warehouse = await Warehouse.findOne({ picode: pincode, isDeleted: false })
      .populate("deliveryboys")
      .exec();
    const applicationManagement = await ApplicationManagement.findOne({}).exec();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouses not found" });
    }
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${warehouse.warehouse_location.lat},${warehouse.warehouse_location.lng}&destination=${destinationLat},${destinationLon}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(directionsUrl);
    if (response.data.status === 'OK') {



      const legs = response.data.routes[0].legs;
      const distanceInMeters = response.data.routes[0].legs[0].distance.value;
      const distanceInKilometers = distanceInMeters / 1000;
      if (distanceInKilometers <= applicationManagement.delivery_coverage_distance) {
        return res.status(200).json({
          success: true,
          message: `The route exists and the distance is ${distanceInKilometers} km. `,
          distance: distanceInKilometers,
          route: legs,
          warehouse: warehouse,
          maintainance_status: warehouse.under_maintance,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `The distance is greater than 7 km. It is ${distanceInKilometers} km. we do not provide delivery service for more than 7 km`
        });
      }
    } else if (response.data.status === 'ZERO_RESULTS') {
      return res.status(400).json({
        success: false,
        message: `The route does not exist.`
      });
    } else if (response.data.status === 'OVER_QUERY_LIMIT') {
      return res.status(400).json({
        success: false,
        message: `sent too many requests within the allowed time period.`
      });
    } else if (response.data.status === 'REQUEST_DENIED') {
      return res.status(400).json({
        success: false,
        message: `Your request was denied.`
      });
    } else if (response.data.status === 'UNKNOWN_ERROR') {
      return res.status(400).json({
        success: false,
        message: `An unknown error occurred.`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching warehouses", error: error.message });
  }
};
exports.getDeliveryBoys = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouses = await Warehouse.findOne({ _id: warehouseId, isDeleted: false }).populate('deliveryboys').select('deliveryboys').exec();
    if (!warehouses) {
      return res.status(404).json({ success: false, message: "Warehouses not found" });
    }
    res.status(200).json({ success: true, message: "Delivery Boys retrieved successfully", data: warehouses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching warehouses", error: error.message });
  }
}

exports.getWarehouseProductCounts = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouse = await Warehouse.findOne({ _id: warehouseId, isDeleted: false }).exec();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouses not found" });
    }

    const productCounts = await Product.countDocuments({ warehouse_ref: warehouse._id });
    const draftCount = await Product.countDocuments({ warehouse_ref: warehouse._id, draft: true });
    const publishedCount = await Product.countDocuments({ warehouse_ref: warehouse._id, draft: false });
    const deletedCount = await Product.countDocuments({ warehouse_ref: warehouse._id, isDeleted: true });
    const filter = {
      "variations.stock": {
        $elemMatch: {
          warehouse_ref: new mongoose.Types.ObjectId(warehouseId), // Match the warehouse reference
          stock_qty: { $lt: 10 }, // Check if stock quantity is less than 10
        },
      },
      isDeleted: false,
      draft: false,
      qc_status: "approved",
    };
    const lowStockCount = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Product counts retrieved successfully",
      warehouse: warehouse,
      AllProductsCount: productCounts,
      DraftProductsCount: draftCount,
      PublishedProductsCount: publishedCount,
      DeletedProductsCount: deletedCount,
      LowStockProductsCount: lowStockCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching warehouses", error: error.message });
  }
};
exports.softDeleteWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouse = await Warehouse.findById(warehouseId).exec();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouses not found" });
    }
    warehouse.isDeleted = true;
    await warehouse.save();
    res.status(200).json({ success: true, message: "Warehouse soft deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error soft deleting warehouse", error: error.message });
  }
};
const Warehouse = require("../models/warehouse_model"); // Adjust the path as per your structure
const User = require("../models/user_models");
// Get all warehouses
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find(); // Fetch all warehouses from the database

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
    const warehouse = await Warehouse.findById(id);
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
      warehouse = await Warehouse.find({ picode: pincode }).exec();
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
    const warehouse = await Warehouse.findOne({ UID: UID }).exec();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    res.status(200).json({ success: true, message: "Warehouse found", warehouse: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching warehouse", error: error.message });
  }
}
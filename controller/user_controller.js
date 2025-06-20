const mongoose = require("mongoose");
const User = require("../models/user_models"); // Assuming User model is in this path
const express = require("express");
const router = express.Router();
const Product = require("../models/product_model");
const Warehouse = require("../models/warehouse_model");
const ApplicationManagement = require("../models/applicationManagementModel");
const Order = require("../models/order_model");
const DeliveryAssignment = require("../models/deliveryAssignment_model");
const Firebase = require("../config/firebase");
const admin = require("firebase-admin");
const moment = require("moment");
const Notification = require("../models/notifications_model");
const { scheduleIdleCartReminder } = require("../utils/cartUtils");
const axios = require("axios");
const { generateAndSendNotificationService } = require("../utils/notificationService");

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const {
      phone,
      displayName,
      UID,
      Address,
      selected_Address,
      cart_products,
      fcm_token,
      saved_cart_products,
      is_deliveryboy,
      is_blocked,
      deliveryboy_aadhar,
      deliveryboy_aadhar_number,
      deliveryboy_driving_licence,
      deliveryboy_driving_licence_number,
      deliveryboy_account,
      deliveryboy_account_number,
      deliveryboy_account_ifsc,
      deliveryboy_bike_number,
      deliveryboy_bike_image,
      deliveryboy_rc_number,
      deliveryboy_rc_image,
      selected_warehouse,
      is_inhouse_deliveryboy,
      assigned_warehouse,
      isWarehouse,
      deliveryboy_pan_number,
      deliveryboy_pan_image,
      vehicle_type,
      is_qc,
    } = req.body;

    // Check if the user already exists with the provided UID or phone
    const existingUser = await User.findOne({ UID });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this UID or phone number" });
    }

    // Create a new user
    const user = new User({
      phone,
      displayName,
      UID,
      Address,
      selected_Address,
      cart_products,
      saved_cart_products,
      fcm_token,
      is_deliveryboy,
      is_blocked,
      deliveryboy_aadhar,
      deliveryboy_aadhar_number,
      deliveryboy_driving_licence,
      deliveryboy_driving_licence_number,
      deliveryboy_account,
      deliveryboy_account_number,
      deliveryboy_account_ifsc,
      deliveryboy_bike_number,
      deliveryboy_bike_image,
      deliveryboy_rc_number,
      deliveryboy_rc_image,
      selected_warehouse,
      is_inhouse_deliveryboy,
      assigned_warehouse,
      isWarehouse,
      deliveryboy_pan_number,
      deliveryboy_pan_image,
      vehicle_type,
      is_qc,
    });

    // Save the new user to the database
    await user.save();

    // Send the response with the created user data
    res.status(201).json({
      message: "User created successfully!",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user", error });
  }
};

// Edit user details
exports.editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Find the user and update their details
    const user = await User.findOneAndUpdate({ UID: userId }, updates, {
      new: true,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error editing user", error });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user and block them
    const user = await User.findOneAndUpdate(
      { UID: userId },
      { is_blocked: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User blocked successfully",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error blocking user", error });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user and unblock them
    const user = await User.findOneAndUpdate(
      { UID: userId },
      { is_blocked: false },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User unblocked successfully",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error unblocking user", error });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const filters = req.query;
    const users = await User.find(filters); // Fetch all users based on filters
    res.status(200).json(users); // Send only the users array
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message }); // Simplified error response
  }
};

// Get all blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const users = await User.find({ is_blocked: true }); // Fetch all blocked users

    res.status(200).json({
      message: "Blocked users fetched successfully",
      users: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching blocked users", error });
  }
};

exports.updateFcmToken = async (req, res) => {
  try {
    const { firebaseId, newFcmToken } = req.body;

    // 1. Input Validation
    if (!firebaseId || !newFcmToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID and FCM token are required",
      });
    }

    // 2. Query Firebase Database

    // Extract UUID from Firebase document
    const userData = await User.findOne({ UID: firebaseId });

    const updatedUser = await User.findByIdAndUpdate(
      userData._id,
      { fcm_token: newFcmToken },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "MongoDB User not found",
      });
    }

    // 4. Success Response
    return res.status(200).json({
      success: true,
      message: "FCM token updated successfully",
      data: {
        userId: updatedUser._id,
        fcmToken: updatedUser.fcm_token,
      },
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get delivery user account if the user is a delivery boy
exports.getDeliveryUserAccount = async (req, res) => {
  try {
    const deliveryUsers = await User.find({ is_deliveryboy: true }); // Fetch all delivery boys

    res.status(200).json({
      message: "Delivery user accounts fetched successfully",
      users: deliveryUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching delivery users", error });
  }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from URL parameters

    // Find the user by their ID
    const user = await User.findOne({ UID: userId })
    .populate("assigned_warehouse")
    .populate("selected_warehouse")
    ;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user data
    res.status(200).json({
      message: "User fetched successfully",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user", error });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from URL parameters
    const { Address } = req.body; // Assuming the address data is in the request body

    // Find the user by their ID
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the address to the user's addresses array
    user.Address.push(Address);
    user.selected_Address = user.Address[user.Address.length - 1];
    user.selected_Address._id = user.Address[user.Address.length - 1]._id;
    await user.save();

    // Return the updated user data
    res.status(200).json({
      message: "Address added successfully",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding address", error });
  }
};

// Add product to cart and update stock in the warehouse
exports.addProductToCart = async (req, res) => {
  try {
    const { userId, product_ref, variant, pincode } = req.body;
    const quantity = 1;
    console.log("one", req.body);
    // Validate required fields
    if (!product_ref || !variant || !pincode || !userId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the product exists
    const product = await Product.findById(product_ref);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Check if the warehouse exists for the given variant
    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!warehouse) {
      return res
        .status(404)
        .json({ message: "Warehouse not found for this variant" });
    }

    const variation = product.variations.find((item) => item._id == variant);
    if (!variation) {
      return res
        .status(404)
        .json({ message: "variation not found for this product" });
    }
    let insufficientStock = false;
    variation.stock.map((item) => {
      if (item.warehouse_ref.equals(warehouse._id)) {
        const stockQty = item.stock_qty;
        if (stockQty < Number(quantity)) {
          insufficientStock = true;
          // return res.status(400).json({ message: "Insufficient stock" });
        } else {
          item.stock_qty -= Number(quantity);
          if (item.stock_qty == 0) {
            item.visibility = false;
          }
        }
      }
    });
    if (insufficientStock) {
      return res
        .status(400)
        .json({ message: "Insufficient stock", setIncrease: false });
    }
    product.variations = product.variations.map((item) => {
      if (item._id == variant) {
        item.variation = variation;
        return item;
      } else {
        return item;
      }
    });

    await product.save();

    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartProductData = {
      product_ref,
      variant: variation,
      quantity,
      pincode,
      selling_price: variation.selling_price * quantity,
      mrp: variation.MRP * quantity,
      buying_price: variation.buying_price * quantity,
      inStock: true,
      final_price: variation.selling_price * quantity,
      variation_visibility: true,
      cart_added_date: new Date(),
    };
    cartProductData.variant._id = variant;

    const cartProduct = user.cart_products.find(
      (item) =>
        item.product_ref == product_ref &&
        item.pincode == pincode &&
        item.variant._id == variant
    );

    // // Check if the product already exists in the cart
    if (cartProduct) {
      // If the product is already in the cart, update the quantity
      user.cart_products.map((item) => {
        if (item.product_ref.equals(product_ref) && item.pincode == pincode) {
          item.quantity += Number(quantity);
          item.selling_price = item.quantity * variation.selling_price;
          item.mrp = item.quantity * variation.MRP;
          item.buying_price = item.quantity * variation.buying_price;
          item.final_price = item.quantity * variation.selling_price;
          item.cart_added_date = new Date();
        }
      });
    } else {
      user.cart_products.push(cartProductData);
    }
    user.cart_added_date = new Date();
    const savedUser = await user.save();

    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 2); // 2-hour delay

    await Notification.updateMany(
      {
        user_ref: user._id,
        redirect_type: "cart",
        scheduled_time: { $gte: new Date() }, // future ones only
        isDeleted: false,
        isRead: false,
      },
      {
        $set: { isDeleted: true },
      }
    );

    const cartNotification = new Notification({
      title: "Your Cart Is Waiting!",
      message: "Don't forget about the items you've added.",
      redirect_url: "/cart",
      redirect_type: "cart",
      user_ref: user._id,
      fcm_token: user.fcm_token || null,
      scheduled_time: scheduledTime,
    });

    await cartNotification.save();
    return res
      .status(201)
      .json({ message: "Product added to cart", data: savedUser });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res
      .status(500)
      .json({ message: "Error adding product to cart", error: error.message });
  }
};

exports.increseCartProductQuantity = async (req, res) => {
  try {
    const { userId, product_ref, pincode, variant } = req.body;
    const quantity = 1;
    let setIncrease = true;

    // Validate required fields
    if (!product_ref || !userId || !pincode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the product exists
    const product = await Product.findById(product_ref);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!warehouse) {
      return res
        .status(404)
        .json({ message: "Warehouse not found for this variant" });
    }

    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cartProduct = user.cart_products.find(
      (item) => item.product_ref == product_ref && item.variant._id == variant
    );

    const variation = product.variations.find((item) =>
      item._id.equals(cartProduct.variant._id)
    );

    if (!variation) {
      return res
        .status(404)
        .json({ message: "variation not found for this product" });
    }
    let insufficientStock = false;

    variation.stock.map((item) => {
      if (item.warehouse_ref.equals(warehouse._id)) {
        const stockQty = item.stock_qty;
        if (stockQty < Number(quantity)) {
          insufficientStock = true;
          // return res.status(400).json({ message: "Insufficient stock", setIncrease: false });
        } else {
          item.stock_qty -= Number(quantity);
          if (item.stock_qty == 0) {
            item.visibility = false;
            setIncrease = false;
          }
        }
      }
    });

    if (insufficientStock) {
      return res
        .status(400)
        .json({ message: "Insufficient stock", setIncrease: false });
    }
    // // Check if the product already exists in the cart
    if (cartProduct) {
      // If the product is already in the cart, update the quantity
      user.cart_products.map((item) => {
        if (item.product_ref.equals(product_ref) && item.pincode == pincode) {
          item.quantity += Number(quantity);
          item.selling_price = item.quantity * variation.selling_price;
          item.mrp = item.quantity * variation.MRP;
          item.buying_price = item.quantity * variation.buying_price;
          item.final_price = item.quantity * variation.selling_price;
          item.cart_added_date = new Date();
        }
      });
    }
    await product.save();
    user.cart_added_date = new Date();
    const savedUser = await user.save();
    await scheduleIdleCartReminder(savedUser);

    return res.status(201).json({
      message: "Cart-Product Quantity increased",
      data: savedUser,
      setIncrease,
    });
  } catch (error) {
    console.error("Error increase product to cart:", error);
    return res.status(500).json({
      message: "Error increase product to cart",
      error: error.message,
    });
  }
};

exports.decreaseCartProductQuantity = async (req, res) => {
  try {
    const { userId, product_ref, pincode, variant } = req.body;
    const quantity = 1;
    let setDecrease = true;

    // Validate required fields
    if (!product_ref || !userId || !pincode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the product exists
    const product = await Product.findById(product_ref);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!warehouse) {
      return res
        .status(404)
        .json({ message: "Warehouse not found for this variant" });
    }

    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cartProduct = user.cart_products.find(
      (item) => item.product_ref == product_ref && item.variant._id == variant
    );

    const variation = product.variations.find((item) =>
      item._id.equals(cartProduct.variant._id)
    );

    if (!variation) {
      return res
        .status(404)
        .json({ message: "variation not found for this product" });
    }

    variation.stock.map((item) => {
      if (item.warehouse_ref.equals(warehouse._id)) {
        const stockQty = item.stock_qty;
        // if (stockQty < Number(quantity)) {
        //   return res.status(400).json({ message: "Insufficient stock", setDecrease: false });
        // } else {
        item.stock_qty += Number(quantity);
        if (item.stock_qty == 0) {
          item.visibility = false;
        }
        // }
      }
    });

    // // Check if the product already exists in the cart
    if (cartProduct) {
      // If the product is already in the cart, update the quantity
      user.cart_products = user.cart_products
        .map((item) => {
          if (item.product_ref.equals(product_ref) && item.pincode == pincode) {
            item.quantity -= Number(quantity);
            item.selling_price = item.quantity * variation.selling_price;
            item.mrp = item.quantity * variation.MRP;
            item.buying_price = item.quantity * variation.buying_price;
            item.final_price = item.quantity * variation.selling_price;
            item.cart_added_date = new Date();

            // If quantity is 0, remove the item from the cart
            if (item.quantity === 0) {
              return null; // Mark the item for removal
            }
          }
          return item;
        })
        .filter((item) => item !== null);
    }
    await product.save();
    user.cart_added_date = new Date();
    const savedUser = await user.save();
    await scheduleIdleCartReminder(savedUser);
    return res
      .status(201)
      .json({ message: "Cart-Product Quantity decreased", data: savedUser });
  } catch (error) {
    console.error("Error increase product to cart:", error);
    return res.status(500).json({
      message: "Error decrease product to cart",
      error: error.message,
    });
  }
};
exports.userSelectedAddressChange = async (req, res) => {
  try {
    const { userId, AddressID } = req.body;
    const userData = await User.findOne({ UID: userId });
    const Address = userData.Address.find((item) => item._id == AddressID);
    const user = await User.findOneAndUpdate(
      { UID: userId },
      { selected_Address: Address },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const response = await cartUpdateOnAddressChange(Address.pincode, userId);

    return res.status(200).json({
      message: "Address changed successfully and CartData Updated",
      data: response,
    });
  } catch (error) {
    console.error("Error changing address:", error);
    return res
      .status(500)
      .json({ message: "Error changing address", error: error.message });
  }
};
//functon to handle cart address change
const cartUpdateOnAddressChange = async (pincode, userId) => {
  try {
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return { success: false, message: "User not found" }; // Return result instead of using res
    }

    // Process cart items
    await Promise.all(
      user.cart_products.map(async (prodItem) => {
        const product = await Product.findById(prodItem.product_ref);
        if (!product) {
          return { success: false, message: "Product not found" }; // Return result instead of using res
        }

        const warehouse = await Warehouse.findOne({ picode: prodItem.pincode });
        if (!warehouse) {
          return {
            success: false,
            message: "Warehouse not found for this variant",
          };
        }

        // Update stock in warehouse
        const variation = product.variations.find((item) =>
          item._id.equals(prodItem.variant._id)
        );
        if (!variation) {
          return {
            success: false,
            message: "Variation not found for this product",
          };
        }

        variation.stock.map((item) => {
          if (item.warehouse_ref.equals(warehouse._id)) {
            if (prodItem.inStock !== false) {
              item.stock_qty += Number(prodItem.quantity);
            }
          }
        });

        const newWarehouse = await Warehouse.findOne({ picode: pincode });
        if (!newWarehouse) {
          return {
            success: false,
            message: "Warehouse not found for this variant",
          };
        }

        // Handle the stock update and item availability logic
        let warehouseFound = false;
        const newVariation = product.variations.find((item) =>
          item._id.equals(prodItem.variant._id)
        );
        if (!newVariation) {
          return {
            success: false,
            message: "Variation not found for this product",
          };
        }

        newVariation.stock.map((item) => {
          if (item.warehouse_ref.equals(newWarehouse._id)) {
            warehouseFound = true;
            const stockQty = item.stock_qty;
            if (stockQty == 0 && item.visibility == false) {
              prodItem.inStock = false;
              prodItem.selling_price = 0;
              prodItem.mrp = 0;
              prodItem.buying_price = 0;
              prodItem.final_price = 0;
            } else if (stockQty < Number(prodItem.quantity) && stockQty > 0) {
              prodItem.inStock = true;
              prodItem.selling_price = stockQty * newVariation.selling_price;
              prodItem.mrp = stockQty * newVariation.MRP;
              prodItem.buying_price = stockQty * newVariation.buying_price;
              prodItem.final_price = stockQty * newVariation.selling_price;
              prodItem.quantity = stockQty;
              item.stock_qty = 0;
              item.visibility = false;
              prodItem.cart_added_date = new Date();
            } else {
              item.stock_qty -= Number(prodItem.quantity);
              prodItem.inStock = true;
              prodItem.selling_price =
                prodItem.quantity * newVariation.selling_price;
              prodItem.mrp = prodItem.quantity * newVariation.MRP;
              prodItem.buying_price =
                prodItem.quantity * newVariation.buying_price;
              prodItem.final_price =
                prodItem.quantity * newVariation.selling_price;
              prodItem.cart_added_date = new Date();
              if (item.stock_qty == 0) {
                item.visibility = false;
              }
            }
          }
        });

        if (!warehouseFound) {
          prodItem.inStock = false;
          prodItem.selling_price = 0;
          prodItem.mrp = 0;
          prodItem.buying_price = 0;
          prodItem.final_price = 0;
          prodItem.variation_visibility = false;
          prodItem.cart_added_date = new Date();
        }

        await product.save();
      })
    );

    user.cart_added_date = new Date();
    const savedUser = await user.save();
    return { success: true, message: "Cart updated successfully" }; // Return success message
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error updating cart" }; // Return error message
  }
};
exports.getUserCartById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ UID: userId })
      .populate({
        path: "cart_products.product_ref",
        populate: [
          { path: "category_ref", model: "Category" }, // Populate category for the product
          {
            path: "sub_category_ref",
            model: "SubCategory",
            populate: { path: "category_ref", model: "Category" }, // Populate category inside sub-category
          },
          { path: "Brand", model: "Brand" },
        ],
      })
      .populate({
        path: "whishlist.product_ref",
        populate: [
          { path: "category_ref", model: "Category" }, // Populate category for the product
          {
            path: "sub_category_ref",
            model: "SubCategory",
            populate: { path: "category_ref", model: "Category" }, // Populate category inside sub-category
          },
          { path: "Brand", model: "Brand" },
        ],
      });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cartProducts = await Promise.all(
      user.cart_products.map(async (prodItem) => {
        const product = await Product.findById(prodItem.product_ref._id);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        console.log("product", product);
        const warehouse = await Warehouse.findOne({ picode: prodItem.pincode });
        console.log("warehouse", warehouse);
        if (!warehouse) {
          return res
            .status(404)
            .json({ message: "Warehouse not found for this variant" });
        }
        const variation = product.variations.find((item) =>
          item._id.equals(prodItem.variant._id)
        );
        prodItem.variant = variation;
        console.log("variation", variation);
        if (!variation) {
          return res
            .status(404)
            .json({ message: "variation not found for this product" });
        }
        console.log("prodItem", prodItem);
        let warehouseFound = false;
        variation.stock.map((item) => {
          if (item.warehouse_ref.equals(warehouse._id)) {
            warehouseFound = true;
            prodItem.selling_price =
              variation.selling_price * Number(prodItem.quantity);
            prodItem.mrp = variation.MRP * Number(prodItem.quantity);
            prodItem.buying_price =
              variation.buying_price * Number(prodItem.quantity);
            prodItem.final_price =
              variation.selling_price * Number(prodItem.quantity);
          }
        });
        if (!warehouseFound) {
          prodItem.inStock = false;
          prodItem.selling_price = 0;
          prodItem.mrp = 0;
          prodItem.buying_price = 0;
          prodItem.final_price = 0;
          prodItem.variation_visibility = false;
        }
      })
    );
    const userData = await user.save();
    const settings = await ApplicationManagement.findOne();
    const necessarySettings = {
      enable_cod: settings.enable_cod,
      delivery_charge: settings.delivery_charge,
      handling_charge: settings.handling_charge,
      high_demand_charge: settings.high_demand_charge,
      enable_Instant_Delivery: settings.enable_Instant_Delivery,
      delivery_charge_tum_tum: settings.delivery_charge_tum_tum,
    };
    return res.status(200).json({
      message: "success",
      user: userData,
      cartProducts: userData.cart_products,
      whishlist: userData.whishlist,
      charges: necessarySettings,
    });
  } catch (error) {
    console.log(error);
  }
};
exports.userStats = async (req, res) => {
  try {
    const user = await User.find();
    const orders = await Order.find();
    const deliveredOrders= await Order.find({order_status:"Delivered"})
    const deliveryFailedOrders= await Order.find({order_status:"Delivery failed"})
    const allUsers = user.length;
    const totaUsers = await User.countDocuments({ isUser: true });
    const totalOrder = orders.length;
    const totalDeliveredOrder = deliveredOrders.length
    const  totalProfit = deliveredOrders.reduce((acc, order) => acc + order.profit, 0);
    const totalDeliveryBoy = await User.countDocuments({
      is_deliveryboy: true,
    });
    const totalWarehouse = await User.countDocuments({ isWarehouse: true });

    return res.status(200).json({
      message: "success",
      allUsers: allUsers,
      totalUsers: totaUsers,
      totalDeliveryBoy: totalDeliveryBoy,
      totalWarehouse: totalWarehouse,
      totalOrder: totalOrder,
      totalDeliveredOrder: totalDeliveredOrder,
      totalProfit: totalProfit,
      totalDeliveryFailedOrder: deliveryFailedOrders.length
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.updateCurrentPincode = async (req, res) => {
  try {
    const { userId, pincode } = req.body;
    const user = await User.findOne({ UID: userId });
    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }
    user.current_pincode = pincode;
    const savedUser = await user.save();
    return res.status(200).json({
      success: true,
      message: "current pincode updated",
      user: savedUser,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error", error: error.message });
  }
};
exports.getsearchHistoryByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const searchHistory = user.search_history;
    return res.status(200).json({ message: "success", searchHistory });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.removeSearchHistoryByUserIdandQueryId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const queryId = req.params.queryId;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const searchHistory = user.search_history;
    const updatedSearchHistory = searchHistory.filter(
      (item) => item._id.toString() !== queryId
    );
    user.search_history = updatedSearchHistory;
    const savedUser = await user.save();
    return res.status(200).json({
      message: "success",
      user: savedUser,
      searchHistory: savedUser.search_history,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};

exports.removeSearchHistoryByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.search_history = [];
    const savedUser = await user.save();
    return res.status(200).json({
      message: "success",
      user: savedUser,
      searchHistory: savedUser.search_history,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.addProductToWhislist = async (req, res) => {
  try {
    const { userId, product_ref, variant } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cartProduct = user.cart_products.find(
      (item) => item.product_ref == product_ref && item.variant._id == variant
    );
    const product = await Product.findById(product_ref);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const warehouse = await Warehouse.findOne({ picode: cartProduct.pincode });
    if (!warehouse) {
      return res
        .status(404)
        .json({ message: "Warehouse not found for this variant" });
    }

    const variation = product.variations.find((item) =>
      item._id.equals(cartProduct.variant._id)
    );
    if (!variation) {
      return res
        .status(404)
        .json({ message: "variation not found for this product" });
    }

    variation.stock.map((item) => {
      if (item.warehouse_ref.equals(warehouse._id)) {
        const stockQty = item.stock_qty;

        item.stock_qty += Number(cartProduct.quantity);
        if (item.stock_qty == 0) {
          item.visibility = false;
        }
      }
    });
    user.cart_products = user.cart_products.filter((item) => {
      return (
        !(item.product_ref.equals(product_ref) &&
          item.variant._id.equals(variant))
      );
    });

    const exists = user.whishlist.some(
      (item) =>
        (item.product_ref.equals(product_ref) &&
          item.variant_id.equals(variant)) ||
        (item.product_ref === product_ref && item.variant_id === variant)
    );
    if (!exists) {
      user.whishlist.push({
        product_ref: product_ref,
        variant_id: variant,
      });
    }
    const saveProduct = await product.save();
    const savedUser = await user.save();
    await scheduleIdleCartReminder(savedUser);

    return res.status(200).json({
      message: "success",
      user: savedUser,
      wishlist: savedUser.whishlist,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.orderAgainUserOrderId = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    await Promise.all(
      order.products.map(async (orderProduct) => {
        const product = await Product.findOne({
          _id: orderProduct.product_ref,
          isDeleted: false,
          draft: false,
        });
        if (!product) {
          console.log("product not found");
          return;
        }
        const warehouse = await Warehouse.findOne({
          picode: orderProduct.pincode,
        });
        const variation = product.variations.find((item) => {
          console.log("item", item._id);
          return item._id.equals(orderProduct.variant._id);
        });
        let warehouseFound = false;
        if (product) {
          variation.stock.map((item) => {
            if (item.warehouse_ref.equals(warehouse._id)) {
              if (
                item.stock_qty >= orderProduct.quantity &&
                item.visibility == true
              ) {
                item.stock_qty -= Number(orderProduct.quantity);
                if (item.stock_qty == 0) {
                  item.visibility = false;
                }
                warehouseFound = true;
                orderProduct.selling_price =
                  variation.selling_price * Number(orderProduct.quantity);
                orderProduct.mrp =
                  variation.MRP * Number(orderProduct.quantity);
                orderProduct.buying_price =
                  variation.buying_price * Number(orderProduct.quantity);
                orderProduct.final_price =
                  variation.selling_price * Number(orderProduct.quantity);
              }
            }
          });
        }
        if (warehouseFound) {
          const exists = user.cart_products.some(
            (item) =>
              item.product_ref.equals(orderProduct.product_ref) &&
              item.variant._id.equals(orderProduct.variant._id)
          );
          if (!exists) {
            await product.save();
            user.cart_products.push(orderProduct);
          }
        }
        await user.save();
      })
    );
    res.status(200).json({
      message: "success",
      user: user,
      cartProducts: user.cart_products,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.editAddress = async (req, res) => {
  try {
    const { userId, addressId, addressData } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.Address = user.Address.map((item) => {
      if (item._id == addressId) {
        return addressData;
      }
      return item;
    });
    const savedUser = await user.save();
    return res.status(200).json({ message: "success", user: savedUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.getDeliveryApplicationByWarehouseId = async (req, res) => {
  try {
    const { warehouseId, status = "pending" } = req.params;
    const warehouse = await Warehouse.findOne({ _id: warehouseId });
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const user = await User.find({
      selected_warehouse: warehouseId,
      deliveryboy_application_status: status,
    });
    return res
      .status(200)
      .json({ message: "success", deliveryApplications: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.approveDeliveryApplication = async (req, res) => {
  try {
    const { deliveryBoyUSerId, status } = req.body;
    const deliveryApplication = await User.findById(deliveryBoyUSerId);
    if (!deliveryApplication) {
      return res
        .status(404)
        .json({ message: "Delivery application not found" });
    }
    deliveryApplication.deliveryboy_application_status = status;
    if (status == "approved") {
      deliveryApplication.assigned_warehouse =
        deliveryApplication.selected_warehouse;
      const warehouse = await Warehouse.findById(
        deliveryApplication.selected_warehouse
      );
      if (
        !warehouse.deliveryboys.some((item) =>
          item.equals(deliveryApplication._id)
        )
      ) {
        warehouse.deliveryboys.push(deliveryApplication._id);
      }
      warehouse.save();
    }
    const savedDeliveryApplication = await deliveryApplication.save();
    return res.status(200).json({
      message: "success",
      deliveryApplication: savedDeliveryApplication,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.blockDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyUserId } = req.body;
    const deliveryApplication = await User.findById(deliveryBoyUserId);
    if (!deliveryApplication) {
      return res
        .status(404)
        .json({ message: "Delivery application not found" });
    }
    deliveryApplication.deliveryboy_application_status = "blocked";
    deliveryApplication.is_blocked = true;
    // deliveryApplication.assigned_warehouse = null;
    const warehouse = await Warehouse.findById(
      deliveryApplication.selected_warehouse
    );
    if (
      warehouse.deliveryboys.some((item) =>
        item.equals(deliveryApplication._id)
      )
    ) {
      warehouse.deliveryboys = warehouse.deliveryboys.filter(
        (item) => !item.equals(deliveryApplication._id)
      );
    }
    warehouse.save();
    const savedDeliveryApplication = await deliveryApplication.save();
    return res.status(200).json({
      message: "success",
      deliveryApplication: savedDeliveryApplication,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.searchDeliveryBoyApplication = async (req, res) => {
  try {
    const { warehouseId, status = "pending" } = req.params;
    const { name } = req.query;
    const warehouse = await Warehouse.findOne({ _id: warehouseId });
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const user = await User.find({
      displayName: { $regex: `${name}`, $options: "i" },
      selected_warehouse: warehouseId,
      deliveryboy_application_status: status,
    });
    return res
      .status(200)
      .json({ message: "success", deliveryApplications: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};

exports.getDeliveryBoyForTumTumByWarehouseId = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouse = await Warehouse.findOne({ _id: warehouseId });
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const user = await User.find({
      assigned_warehouse: warehouseId,
      deliveryboy_application_status: "approved",
      deliveryboy_day_availability_status: true,
      "deliveryboy_order_availability_status.tum_tum": true,
      is_blocked: false,
      assigned_orders: { $exists: true, $size: 0 }
    });
    return res.status(200).json({ message: "success", deliveryBoys: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.getUsersAdmin = async (req, res) => {
  try {
    const users = await User.find({ isUser: true });
    const finalData = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({
          user_ref: user._id,
          order_status: "Delivered",
        });
        const total_orders = orders.length;
        const total_amount = orders.reduce(
          (acc, order) => acc + order.total_amount,
          0
        );
        const total_profit = orders.reduce(
          (acc, order) => acc + order.profit,
          0
        );
        return {
          ...user._doc,
          total_orders,
          total_amount,
          total_profit,
        };
      })
    );
    return res
      .status(200)
      .json({ success: true, message: "success", users: finalData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error", error });
  }
};
exports.searchUsers = async (req, res) => {
  try {
    const { name } = req.query;
    const users = await User.find({
      phone: { $regex: `${name}`, $options: "i" },
      isUser: true,
    });
    const finalData = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({
          user_ref: user._id,
          order_status: "Delivered",
        });
        const total_orders = orders.length;
        const total_amount = orders.reduce(
          (acc, order) => acc + order.total_amount,
          0
        );
        const total_profit = orders.reduce(
          (acc, order) => acc + order.profit,
          0
        );
        return {
          ...user._doc,
          total_orders,
          total_amount,
          total_profit,
        };
      })
    );
    return res
      .status(200)
      .json({ success: true, message: "success", users: finalData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error", error });
  }
};

exports.getDeliveryboys = async (req, res) => {
  try {
    const users = await User.find({
      deliveryboy_application_status: "approved",
      is_deliveryboy: true,
    }).populate("assigned_warehouse");
    const user = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({
          delivery_boy: user._id,
          order_status: "Delivered",
        });
        const total_orders = orders.length;
        return {
          ...user._doc,
          total_orders,
        };
      })
    );
    res.status(200).json({
      success: true,
      message: "Delivery Boys retrieved successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching warehouses",
      error: error.message,
    });
  }
};

exports.searchDeliveryBoys = async (req, res) => {
  try {
    const { name } = req.query;
    const users = await User.find({
      displayName: { $regex: `${name}`, $options: "i" },
      deliveryboy_application_status: "approved",
      is_deliveryboy: true,
    }).populate("assigned_warehouse");
    const user = await Promise.all(
      users.map(async (user) => {
        const orders = await Order.find({
          delivery_boy: user._id,
          order_status: "Delivered",
        });
        const total_orders = orders.length;
        return {
          ...user._doc,
          total_orders,
        };
      })
    );
    return res
      .status(200)
      .json({ success: true, message: "success", users: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error", error });
  }
};
exports.unblockDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyUserId } = req.body;
    const deliveryApplication = await User.findById(deliveryBoyUserId);
    deliveryApplication.deliveryboy_application_status = "approved";
    deliveryApplication.is_blocked = false;
    // deliveryApplication.assigned_warehouse = null;
    const warehouse = await Warehouse.findById(
      deliveryApplication.selected_warehouse
    );
    if (
      !warehouse.deliveryboys.some((item) =>
        item.equals(deliveryApplication._id)
      )
    ) {
      warehouse.deliveryboys.push(deliveryApplication._id);
    }
    warehouse.save();
    const savedDeliveryApplication = await deliveryApplication.save();
    return res.status(200).json({
      message: "success",
      deliveryApplication: savedDeliveryApplication,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
exports.changeDeliveryBoyDayAvailibilityStatus = async (req, res) => {
  try {
    const { deliveryBoyUserId } = req.body;
    const user = await User.findOne({ UID: deliveryBoyUserId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery boy not found" });
    }
    const deliveryAssignments = await DeliveryAssignment.find({
      delivery_boy_ref: user._id,
      // tum_tumdelivery_start_time: {
      //   $gte: moment().startOf("day").local().toDate(),
      //   $lt: moment().endOf("day").local().toDate(),
      // },
      status: "Pending",
    });
    if (deliveryAssignments.length > 0) {
      return res.status(200).json({
        success: false,
        message: "Delivery boy is assigned to an order cannot change status",
      });
    }
    if (user.assigned_orders.length > 0) {
      return res.status(200).json({
        success: false,
        message: "Delivery boy is assigned to an order cannot change status",
      });
    }

    user.deliveryboy_day_availability_status =
      !user.deliveryboy_day_availability_status;
    const savedDeliveryBoy = await user.save();
    return res
      .status(200)
      .json({ success: true, message: "success", user: savedDeliveryBoy });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error", error });
  }
};
exports.moveProductFromWhishlistToCart = async (req, res) => {
  try {
    const { whishlist_itemId, user_ref, pincode } = req.body;
    console.log("req.body", req.body);
    const quantity = 1;
    const user = await User.findOne({ UID: user_ref });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const whishlist_item = user.whishlist.find((item) =>
      item._id.equals(whishlist_itemId)
    );
    if (!whishlist_item) {
      return res
        .status(404)
        .json({ success: false, message: "Whishlist item not found" });
    }
    const product = await Product.findOne({
      _id: whishlist_item.product_ref,
      isDeleted: false,
      draft: false,
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const variation = product.variations.find((item) => {
      return item._id.equals(whishlist_item.variant_id);
    });
    if (!variation) {
      return res
        .status(404)
        .json({ success: false, message: "variant not found" });
    }
    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found for this variant",
      });
    }
    let insufficientStock = false;
    variation.stock.map((item) => {
      if (item.warehouse_ref.equals(warehouse._id)) {
        const stockQty = item.stock_qty;
        if (stockQty < Number(quantity)) {
          insufficientStock = true;
          // return res.status(400).json({ message: "Insufficient stock" });
        } else {
          item.stock_qty -= Number(quantity);
          if (item.stock_qty == 0) {
            item.visibility = false;
          }
        }
      }
    });
    if (insufficientStock) {
      return res
        .status(400)
        .json({ message: "Insufficient stock", setIncrease: false });
    }
    product.variations = product.variations.map((item) => {
      if (item._id == variation._id) {
        item.variation = variation;
        return item;
      } else {
        return item;
      }
    });

    await product.save();
    const cartProductData = {
      product_ref: whishlist_item.product_ref,
      variant: variation,
      quantity,
      pincode,
      selling_price: variation.selling_price * quantity,
      mrp: variation.MRP * quantity,
      buying_price: variation.buying_price * quantity,
      inStock: true,
      final_price: variation.selling_price * quantity,
      variation_visibility: true,
      cart_added_date: new Date(),
    };
    cartProductData.variant._id = variation._id;

    const cartProduct = user.cart_products.find(
      (item) =>
        item.product_ref == whishlist_item.product_ref &&
        item.pincode == pincode &&
        item.variant._id == variation._id
    );
    if (cartProduct) {
      // If the product is already in the cart, update the quantity
      user.cart_products.map((item) => {
        if (
          item.product_ref.equals(whishlist_item.product_ref) &&
          item.pincode == pincode &&
          item.variant._id.equals(variation._id)
        ) {
          item.quantity += Number(quantity);
          item.selling_price = item.quantity * variation.selling_price;
          item.mrp = item.quantity * variation.MRP;
          item.buying_price = item.quantity * variation.buying_price;
          item.final_price = item.quantity * variation.selling_price;
          item.cart_added_date = new Date();
        }
      });
    } else {
      user.cart_products.push(cartProductData);
    }
    user.cart_added_date = new Date();
    user.whishlist = user.whishlist.filter(
      (item) => !item._id.equals(whishlist_itemId)
    );
    const savedUser = await user.save();
    return res
      .status(201)
      .json({ message: "Product added to cart", data: savedUser });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      success: false,
      message: "error moving item from whishlist to cart ",
      error: error,
    });
  }
};

exports.removeWhishlistItem = async (req, res) => {
  try {
    const { whishlist_itemId, user_ref } = req.body;
    const user = await User.findOne({ UID: user_ref });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const whishlist_item = user.whishlist.find((item) =>
      item._id.equals(whishlist_itemId)
    );
    if (!whishlist_item) {
      return res
        .status(404)
        .json({ success: false, message: "Whishlist item not found" });
    }
    user.whishlist = user.whishlist.filter(
      (item) => !item._id.equals(whishlist_itemId)
    );
    // const savedUser = await user.save();
    return res
      .status(201)
      .json({ message: "Whishlist item removed", data: user });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      success: false,
      message: "error removing item from whishlist ",
      error: error,
    });
  }
};
exports.removeAddress = async (req, res) => {
  try {
    const { addressId, user_ref } = req.body;
    const user = await User.findOne({ UID: user_ref });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    user.Address = user.Address.filter(
      (item) => !item._id.equals(addressId)
    );
    if (user.selected_Address._id.equals(addressId)) {
      if (user.Address.length > 0) {
        user.selected_Address = user.Address[user.Address.length - 1];
        user.selected_Address._id = user.Address[user.Address.length - 1]._id;
      } else {
        user.selected_Address = null;
      }
    }
    const savedUser = await user.save();
    return res
      .status(201)
      .json({ message: "Address removed", data: savedUser });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      success: false,
      message: "error removing address ",
      error: error,
    });
  }
};
exports.getInstantdeliveryByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const status = req.query.status || "assigned"; // Default to 'assigned' if not provided
    const user = await User.findOne({ UID: userId })
      .populate({
        path: "assigned_orders",
        populate: [{
          path: "order_ref",
        },
        ]
      })
      .populate({
        path: 'assigned_orders.order_ref',
        populate: [
          { path: 'user_ref', model: 'User' },
          { path: 'warehouse_ref', model: 'Warehouse' },
          {
            path: 'products.product_ref',
            model: 'Product'
          }
        ]
      })
      .populate({
        path: "assigned_orders_with_mapUrl.orders.orderId",
        populate: [
          {
            path: "warehouse_ref",
            model: "Warehouse"
          },
          {
            path: "user_ref",
            model: "User"
          },
          {
            path: "products.product_ref", // Assuming products is an array with product_ref
            model: "Product"
          }
        ]
      })
      .exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (status === "assigned" && (!user.assigned_order_mapUrl_status)) {
      console.log("Fetching instant delivery orders with status:", status);
      const instantDelivery = user.assigned_orders.filter(
        (order) => order.status === status
      );
      const orders = instantDelivery.map(order => {
        return ({ orderId: order.order_ref, status: "Pending" })
      });
      const returnData = {
        orders: orders,
        status: "Pending",
        map_url: null
      }
      return res.status(200).json({ success: true, message: "order Fetched Successfully", data: returnData });
    } else {

      return res.status(200).json({ success: true, message: "order Fetched Successfully", data: user.assigned_orders_with_mapUrl });
    }

  } catch (error) {
    console.error("Error fetching instant delivery orders:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
exports.pickUpInstantDelivery = async (req, res) => {
  try {
    const { userId, orderId } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const order = user.assigned_orders.find((order) => order.order_ref.equals(orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    order.status = "picked_up";
    const savedUser = await user.save();
    const orderData = await Order.findById(orderId);
    if (!orderData) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    orderData.order_status = "Out for delivery";
    orderData.out_for_delivery_time = new Date();
    await orderData.save();
    return res.status(200).json({ success: true, message: "Order picked up successfully", data: savedUser });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ success: false, message: "Error picking up order", error: error.message });
  }
};
exports.completeInstantDelivery = async (req, res) => {
  try {
    const { userId, orderId, otp } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const orderData = await Order.findById(orderId);
    if (!orderData) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (orderData.otp !== otp) {
      return res.status(200).json({ success: false, message: "Invalid OTP" });
    }
    orderData.order_status = "Delivered";
    orderData.completed_time = new Date();
    await orderData.save();
    const order = user.assigned_orders.find((order) => order.order_ref.equals(orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    order.status = "delivered";
    const savedUser = await user.save();

    return res.status(200).json({ success: true, message: "Order completed successfully", data: savedUser });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ success: false, message: "Error completing order", error: error.message });
  }
};
exports.getSingleInstantOrderWithMapUrl = async (req, res) => {
  try {
    const { userId, orderId, curlat, curlong } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const order = user.assigned_orders.find((order) => order.order_ref.equals(orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    const orderData = await Order.findById(orderId);
    if (!orderData) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    const mapUrl = `https://www.google.com/maps/dir/?api=1` +
      `&origin=${curlat},${curlong}` +
      `&destination=${orderData.user_location.lat},${orderData.user_location.lang}` +
      // `&waypoints=${optimizedDestinations.map(d => `${d.lat},${d.lng}`).join('|')}` +
      `&travelmode=driving` +
      `&dir_action=navigate`;

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      order: orderData,
      mapUrl,
    });
  } catch (error) {
    console.error("Error fetching instant order:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

exports.generateInstantDeliveryRoute = async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const user = await User.findOne({ UID: deliveryBoyId }).populate({
      path: "assigned_orders",
      populate: [{
        path: "order_ref",
      },
      ]
    })
      .populate({
        path: 'assigned_orders.order_ref',
        populate: [
          { path: 'user_ref', model: 'User' },
          { path: 'warehouse_ref', model: 'Warehouse' },
          {
            path: 'products.product_ref',
            model: 'Product'
          }
        ]
      });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.assigned_order_mapUrl_status) {
      return res.status(200).json({ message: "Map URL already generated", mapUrl: user.assigned_orders_with_mapUrl });
    }
    const warehouse = await Warehouse.findById(user.selected_warehouse);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const source = warehouse.warehouse_location;
    const destinations = user.assigned_orders.map(order => {
      return ({
        lat: order.order_ref.user_location.lat,
        lng: order.order_ref.user_location.lang,
        orders: order.order_ref._id
      })
    });

    if (!source || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ message: "Source and destinations are required." });
    }
    let tempDesitinations = destinations;
    let tempSource = source;
    let optimizedDestinations = [];

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;


    if (user.assigned_orders.length > 1) {
      while (tempDesitinations.length > 0) {
        const origin = `${tempSource.lat},${tempSource.lng}`;
        const destStr = tempDesitinations
          .map(dest => `${dest.lat},${dest.lng}`)
          .join('|');
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destStr}&key=${apiKey}`;

        const response = await axios.get(url);
        const data = response.data;
        if (data.status !== 'OK') {
          return res.status(500).json({ message: "Failed to fetch distance data", details: data.error_message });
        }
        let distances = data.rows[0].elements.map((el, index) => ({
          destination: tempDesitinations[index],
          distance: el.distance?.text,
          duration: el.duration?.text,
          value: el.distance?.value,
          status: el.status
        }));
        const validDistances = distances.filter(d => d.status === 'OK' && d.value !== undefined);
        const minDistance = Math.min(...validDistances.map(d => d.value));
        const minDistanceObj = validDistances.find(d => d.value === minDistance);
        if (minDistanceObj) {
          optimizedDestinations.push({ ...minDistanceObj.destination, meter_distance: minDistance });
          tempDesitinations = tempDesitinations.filter(dest => {
            return (dest !== minDistanceObj.destination);
          });
          tempSource = minDistanceObj.destination; // Update source to the last selected destination
          tempSource = {
            lat: minDistanceObj.destination.lat,
            lng: minDistanceObj.destination.lng
          };
        }
      }

      const finalDestinations = optimizedDestinations.map(dest => {
        return ({
          orderId: dest.orders,
          status: "Pending",
        });
      });
      let waypoints = optimizedDestinations
        .slice(0, -1) // Removes the last element
        .map(d => ({
          lat: d.lat,
          lng: d.lng,
        }));
      console.log("waypoints", waypoints);
      console.log("optimizedDestinations", waypoints
        .map((d) => `${d.lat},${d.lng}`)
        .join("|"));
      const mapsUrl =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${warehouse.warehouse_location.lat},${warehouse.warehouse_location.lng}` +
        `&destination=${optimizedDestinations[optimizedDestinations.length - 1].lat},${optimizedDestinations[optimizedDestinations.length - 1].lng
        }` +
        `&waypoints=${optimizedDestinations
          .map((d) => `${d.lat},${d.lng}`)
          .join("|")}` +
        `&travelmode=driving` +
        `&dir_action=navigate`;
      user.assigned_orders_with_mapUrl = {
        orders: finalDestinations,
        map_url: mapsUrl,
        status: "Pending",
      }
      user.assigned_order_mapUrl_status = true;

      user.assigned_order_mapUrl_status = true;
      user.deliveryboy_order_availability_status.instant.status = false;
      user.deliveryboy_order_availability_status.tum_tum = false;
      await user.save();

      const orderIds = finalDestinations.map(dest => dest.orderId);
      const result = await User.updateOne(
        {
          _id: user._id,
          "assigned_orders.order_ref": { $in: orderIds } // Match orders in the array
        },
        {
          $set: {
            "assigned_orders.$[elem].status": "picked_up" // Update status
          }
        },
        {
          arrayFilters: [
            { "elem.order_ref": { $in: orderIds } } // Filter to target specific orders
          ]
        }
      );
      finalDestinations.map(async (dest) => {
        const order = await Order.findById(dest.orderId);
        if (order) {
          order.order_status = "Out for delivery";
          order.out_for_delivery_time = new Date();
          order.save();
        }
      });

      return res.status(200).json({
        origin: source,
        // optimizedDestinations: optimizedDestinations,
        finalDestinations: finalDestinations,
        mapsUrl: mapsUrl,
        // destinations: distances,

      });
    } else {
      const finalDestinations = user.assigned_orders.map(order => {
        return ({
          orderId: order.order_ref._id,
          status: "Pending",
        });
      });
      const mapsUrl =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${warehouse.warehouse_location.lat},${warehouse.warehouse_location.lng}` +
        `&destination=${user.assigned_orders[0].order_ref.user_location.lat},${user.assigned_orders[0].order_ref.user_location.lang}` +
        `&travelmode=driving` +
        `&dir_action=navigate`;
      user.assigned_orders_with_mapUrl = {
        orders: finalDestinations,
        map_url: mapsUrl,
        status: "Pending",
      }
      user.assigned_order_mapUrl_status = true;
      user.deliveryboy_order_availability_status.instant.status = false;
      user.deliveryboy_order_availability_status.tum_tum = false;



      await user.save();
      const orderIds = finalDestinations.map(dest => dest.orderId);
      const result = await User.updateOne(
        {
          _id: user._id,
          "assigned_orders.order_ref": { $in: orderIds } // Match orders in the array
        },
        {
          $set: {
            "assigned_orders.$[elem].status": "picked_up" // Update status
          }
        },
        {
          arrayFilters: [
            { "elem.order_ref": { $in: orderIds } } // Filter to target specific orders
          ]
        }
      );
      finalDestinations.map(async (dest) => {
        const order = await Order.findById(dest.orderId);
        if (order) {
          order.order_status = "Out for delivery";
          order.out_for_delivery_time = new Date();
          order.save();
        }
      });

      return res.status(200).json({
        origin: source,
        // optimizedDestinations: optimizedDestinations,
        finalDestinations: finalDestinations,
        mapsUrl: mapsUrl,
        // destinations: distances,

      });
    }

    // // // Format coordinates
    // const origin = `${tempSource.lat},${tempSource.lng}`;
    // const destStr = tempDesitinations
    //   .map(dest => `${dest.lat},${dest.lng}`)
    //   .join('|');

    // // Call Google Maps Distance Matrix API
    // const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destStr}&key=${apiKey}`;

    // const response = await axios.get(url);
    // const data = response.data;

    // if (data.status !== 'OK') {
    //   return res.status(500).json({ message: "Failed to fetch distance data", details: data.error_message });
    // }


    // // Format the response neatly
    // const distances = data.rows[0].elements.map((el, index) => ({
    //   destination: destinations[index],
    //   distance: el.distance?.text,
    //   duration: el.duration?.text,
    //   value: el.distance?.value,
    //   status: el.status
    // }));



  } catch (err) {
    console.error("Error in getDistances:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

exports.deliverInstantOrder = async (req, res) => {
  try {
    const { orderId, otp, userId } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    if (order.otp !== otp) {
      return res.status(200).json({ success: false, message: "Invalid OTP" });
    }
    order.order_status = "Delivered";
    order.completed_time = new Date();
    await order.save();
    user.assigned_orders = user.assigned_orders.map((item) => {
      if (item.order_ref.equals(orderId)) {
        item.status = "delivered";
      }
      return item;
    });
    user.assigned_orders_with_mapUrl.orders = user.assigned_orders_with_mapUrl.orders.map((item) => {
      if (item.orderId.equals(orderId)) {
        item.status = "Completed";
      }
      return item;
    });
    const savedUser = await user.save();
    const allDone = user.assigned_orders_with_mapUrl.orders.every((item) => item.status === "Completed");
    if (allDone) {
      user.assigned_order_mapUrl_status = false;
      user.deliveryboy_order_availability_status.instant.status = true;
      user.deliveryboy_order_availability_status.tum_tum = true;
      const mapUrlOrderIds = user.assigned_orders_with_mapUrl.orders.map(order =>
        order.orderId.toString()
      );
      user.assigned_orders = user.assigned_orders.filter(order => {
        return !mapUrlOrderIds.includes(order.order_ref.toString());
      });
      user.assigned_orders_with_mapUrl = null;
      const savedUser = await user.save();
      return res.status(200).json({
        success: true,
        message: "Order delivered successfully",
        data: savedUser,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      data: savedUser,
    });

  }
  catch (err) {
    console.error("Error in deliverInstantOrder:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

exports.deliverFailedInstantOrder = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.order_status = "Delivery failed";
    order.failed_time = new Date();
    await order.save();
    user.assigned_orders = user.assigned_orders.map((item) => {
      if (item.order_ref.equals(orderId)) {
        item.status = "delivered";
      }
      return item;
    });
    user.assigned_orders_with_mapUrl.orders = user.assigned_orders_with_mapUrl.orders.map((item) => {
      if (item.orderId.equals(orderId)) {
        item.status = "Completed";
      }
      return item;
    });
    const savedUser = await user.save();
    const allDone = user.assigned_orders_with_mapUrl.orders.every((item) => item.status === "Completed");
    if (allDone) {
      user.assigned_order_mapUrl_status = false;
      user.deliveryboy_order_availability_status.instant.status = true;
      user.deliveryboy_order_availability_status.tum_tum = true;
      const mapUrlOrderIds = user.assigned_orders_with_mapUrl.orders.map(order =>
        order.orderId.toString()
      );
      user.assigned_orders = user.assigned_orders.filter(order => {
        return !mapUrlOrderIds.includes(order.order_ref.toString());
      });
      user.assigned_orders_with_mapUrl = null;
      const savedUser = await user.save();
      const title = "Your Order Has Been Cancelled or Failed to be Delivered!";
      const message = `Your order #${orderId} has been cancelled or failed to be delivered due to some reason. Thank you for shopping with us!`;
      const redirectUrl = `/orders/${orderId}`; // Redirect user to their order page
      const redirectType = "order"; // Redirect type (can be used for custom logic)
      const extraData = { orderId };

      // Send the notification
      await generateAndSendNotificationService(
        {
          title,
          message,
          userId: order.user_ref, // User reference who placed the order
          redirectUrl,
          imageUrl: null, // Optional: Add image URL if required
          redirectType,
          extraData
        }
      );
      return res.status(200).json({
        success: true,
        message: "Order delivered successfully",
        data: savedUser,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      data: savedUser,
    });

  }
  catch (err) {
    console.error("Error in deliverInstantOrder:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

exports.assignOrdersToDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyId, orderIds } = req.body;
    console.log("deliveryBoyId", deliveryBoyId);
    let user = await User.findById(deliveryBoyId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const orders = await Order.find({ _id: { $in: orderIds }, order_status: { $in: ["Packing", "Order placed"] } });
    if (!orders) {
      return res
        .status(404)
        .json({ success: false, message: "Orders not found" });
    }
    await Promise.all(orders.map(async (order) => {
      if (user.assigned_orders.length < 5) {
        order.order_status = "Delivery Partner Assigned";
        order.delivery_boy = user._id;
        await order.save();
        user.assigned_orders.push({
          order_ref: order._id,
          assigned_time: new Date(),
          status: "assigned",
        });
        user.deliveryboy_order_availability_status.instant.last_assigned_at = new Date();
        user = await user.save();
        const title = "Your Order Has Been Assigned to Delivery Partner!";
        const message = `Your order #${order._id} has been assigned to a delivery partner. Thank you for shopping with us!`;
        const redirectUrl = `/orders/${order._id}`; // Redirect user to their order page
        const redirectType = "order"; // Redirect type (can be used for custom logic)
        const extraData = { orderId: order._id };

        // Send the notification
        const result1 = await generateAndSendNotificationService(
          {
            title,
            message,
            userId: order.user_ref, // User reference of the person who placed the order
            redirectUrl,
            imageUrl: null, // Optional: add image URL if needed
            redirectType,
            extraData
          }
        );
        console.log("result1", result1);
        const delivery_title = "New Instant Order Assigned!";
        const delivery_message = `The order #${order._id} has been assigned to you. Thank you for working with us!`;
        const delivery_redirectUrl = `/orders/${order._id}`; // Redirect user to their order page
        const delivery_redirectType = "order"; // Redirect type (can be used for custom logic)
        const delivery_extraData = { orderId: order._id };

        // Send the notification
        const result2 = await generateAndSendNotificationService(
          {
            title: delivery_title,
            message: delivery_message,
            userId: deliveryBoyId, // User reference of the person who placed the order
            redirectUrl: null,
            imageUrl: null, // Optional: add image URL if needed
            redirectType: null,
            extraData: delivery_extraData
          }
        );
        console.log("result2", result2);
        
      }

    }));




    return res.status(200).json({
      success: true,
      message: "Orders assigned successfully",
      data: user.assigned_orders,
      user: user,
    });
  } catch (err) {
    console.error("Error in assignOrdersToDeliveryBoy:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

exports.getDeliveryBoyForInstantByWarehouseId = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouse = await Warehouse.findOne({ _id: warehouseId });
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const user = await User.find({
      assigned_warehouse: warehouseId,
      deliveryboy_application_status: "approved",
      deliveryboy_day_availability_status: true,
      "deliveryboy_order_availability_status.tum_tum": true,
      "deliveryboy_order_availability_status.instant.status": true,
      is_blocked: false,
    });
    return res.status(200).json({ message: "success", deliveryBoys: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error", error });
  }
};
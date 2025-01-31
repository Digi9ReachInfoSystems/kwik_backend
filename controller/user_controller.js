const mongoose = require("mongoose");
const User = require("../models/user_models"); // Assuming User model is in this path
const express = require("express");
const router = express.Router();
const Product = require("../models/product_model");
const Warehouse = require("../models/warehouse_model");
// Create a new user
exports.createUser = async (req, res) => {
  try {
    const {
      phone,
      name,
      UID,
      Address,
      selected_Address,
      cart_products,
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
      assigned_warehouse,
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
      name,
      UID,
      Address,
      selected_Address,
      cart_products,
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
      assigned_warehouse,
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
    const user = await User.findOneAndUpdate({ UID: userId }, updates, { new: true });
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
    const user = await User.findById(userId);
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


// Add product to cart and update stock in the warehouse
exports.addProductToCart = async (req, res) => {
  try {
    const { userId, product_ref, variant, quantity, pincode } = req.body;

    // Validate required fields
    if (!product_ref || !variant || !quantity || !pincode || !userId) {
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
      return res.status(404).json({ message: "Warehouse not found for this variant" });
    }

    const variation = product.variations.find((item) => item._id == variant);
    if (!variation) {
      return res.status(404).json({ message: "variation not found for this product" });
    }

    variation.stock.map((item) => {
      if ((item.warehouse_ref.equals(warehouse._id))) {
        const stockQty = item.stock_qty;
        if (stockQty < quantity) {
          return res.status(400).json({ message: "Insufficient stock" });
        } else {
          item.stock_qty -= quantity;
          if (item.stock_qty == 0) {
            item.visibility = false;
          }
        }
      }
    })

    product.variations = product.variations.map((item) => {
      if (item._id == variant) {
        item.variation = variation;
        return item;
      } else {
        return item;
      }
    })

    await product.save();



    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare cart product data
    const cartProductData = {
      product_ref,
      variant: variation,
      quantity,
      pincode,
      selling_price: variation.selling_price,
      mrp: variation.MRP,
      buying_price: variation.buying_price,
      inStock: true,
      final_price: variation.selling_price * quantity
    };

    const cartProduct = user.cart_products.find((item) => item.product_ref == product_ref && item.pincode == pincode);

    // // Check if the product already exists in the cart
    if (cartProduct) {
      // If the product is already in the cart, update the quantity
      user.cart_products.map((item) => {
        if (item.product_ref.equals(product_ref) && item.pincode == pincode) {
          item.quantity += Number(quantity);
          console.log("item", item);
        }
      })
    } else {
      user.cart_products.push(cartProductData);
    }
    user.cart_added_date=new Date();
    const savedUser = await user.save();
    return res.status(201).json({ message: "Product added to cart", data: savedUser });

  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).json({ message: "Error adding product to cart", error: error.message });
  }
};

// exports.increseCartProductQuantity = async (req, res) => {
//   try {
//     const { userId, product_ref,   } = req.body;

//     // Validate required fields
//     if (!product_ref  || !userId) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // Check if the product exists
//     const product = await Product.findById(product_ref);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

    

//     const user = await User.findOne({ UID: userId });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Prepare cart product data  
//     const cartProductData = {
//       product_ref,
//       variant: variation,
//       quantity,
//       pincode,
//       selling_price: variation.selling_price,
//       mrp: variation.MRP,
//       buying_price: variation.buying_price,
//       inStock: true,
//       final_price: variation.selling_price * quantity
//     };

//     const cartProduct = user.cart_products.find((item) => item.product_ref == product_ref && item.pincode == pincode);

//     // // Check if the product already exists in the cart
//     if (cartProduct) {
//       // If the product is already in the cart, update the quantity
//       user.cart_products.map((item) => {
//         if (item.product_ref.equals(product_ref) && item.pincode == pincode) {
//           item.quantity += Number(quantity);
//           console.log("item", item);
//         }
//       })
//     } else {
//       user.cart_products.push(cartProductData);
//     }
//     console.log("user", user);
//     const savedUser = await user.save();
//     return res.status(201).json({ message: "Product added to cart", data: savedUser });

//   } catch (error) {
//     console.error("Error adding product to cart:", error);
//   }
// }

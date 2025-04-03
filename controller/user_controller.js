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
      displayName,
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
      isWarehouse,
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
      isWarehouse,
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
    const user = await User.findOne({ UID: userId });
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
}


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
      return res.status(404).json({ message: "Warehouse not found for this variant" });
    }

    const variation = product.variations.find((item) => item._id == variant);
    if (!variation) {
      return res.status(404).json({ message: "variation not found for this product" });
    }

    variation.stock.map((item) => {
      if ((item.warehouse_ref.equals(warehouse._id))) {
        const stockQty = item.stock_qty;
        if (stockQty < Number(quantity)) {
          return res.status(400).json({ message: "Insufficient stock" });
        } else {
          item.stock_qty -= Number(quantity);
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
      selling_price: variation.selling_price * quantity,
      mrp: variation.MRP * quantity,
      buying_price: variation.buying_price * quantity,
      inStock: true,
      final_price: variation.selling_price * quantity,
      variation_visibility: true,
      cart_added_date: new Date(),
    };
    cartProductData.variant._id = variant;

    const cartProduct = user.cart_products.find((item) => item.product_ref == product_ref && item.pincode == pincode && item.variant._id == variant);

    // // Check if the product already exists in the cart
    if (cartProduct) {
      // If the product is already in the cart, update the quantity
      user.cart_products.map((item) => {
        if (item.product_ref.equals(product_ref) && item.pincode == pincode) {
          item.quantity += Number(quantity);
          item.selling_price = item.quantity * variation.selling_price
          item.mrp = item.quantity * variation.MRP
          item.buying_price = item.quantity * variation.buying_price
          item.final_price = item.quantity * variation.selling_price
          item.cart_added_date = new Date();
        }
      })
    } else {
      user.cart_products.push(cartProductData);
    }
    user.cart_added_date = new Date();
    const savedUser = await user.save();
    return res.status(201).json({ message: "Product added to cart", data: savedUser });

  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).json({ message: "Error adding product to cart", error: error.message });
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
      return res.status(404).json({ message: "Warehouse not found for this variant" });
    }

    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cartProduct = user.cart_products.find((item) => item.product_ref == product_ref && item.variant._id == variant);


    const variation = product.variations.find((item) => item._id.equals(cartProduct.variant._id));

    if (!variation) {
      return res.status(404).json({ message: "variation not found for this product" });
    }

    variation.stock.map((item) => {
      if ((item.warehouse_ref.equals(warehouse._id))) {
        const stockQty = item.stock_qty;
        if (stockQty < Number(quantity)) {
          return res.status(400).json({ message: "Insufficient stock", setIncrease: false });
        } else {
          item.stock_qty -= Number(quantity);
          if (item.stock_qty == 0) {
            item.visibility = false;
            setIncrease = false;
          }
        }
      }
    })


    // // Check if the product already exists in the cart
    if (cartProduct) {
      // If the product is already in the cart, update the quantity
      user.cart_products.map((item) => {
        if (item.product_ref.equals(product_ref) && item.pincode == pincode) {
          item.quantity += Number(quantity);
          item.selling_price = item.quantity * variation.selling_price
          item.mrp = item.quantity * variation.MRP
          item.buying_price = item.quantity * variation.buying_price
          item.final_price = item.quantity * variation.selling_price
          item.cart_added_date = new Date();
        }
      })
    }
    await product.save();
    user.cart_added_date = new Date();
    const savedUser = await user.save();
    return res.status(201).json({ message: "Cart-Product Quantity increased", data: savedUser, setIncrease });

  } catch (error) {
    console.error("Error increase product to cart:", error);
    return res.status(500).json({ message: "Error increase product to cart", error: error.message });
  }
}



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
      return res.status(404).json({ message: "Warehouse not found for this variant" });
    }

    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cartProduct = user.cart_products.find((item) => item.product_ref == product_ref && item.variant._id == variant);


    const variation = product.variations.find((item) => item._id.equals(cartProduct.variant._id));

    if (!variation) {
      return res.status(404).json({ message: "variation not found for this product" });
    }

    variation.stock.map((item) => {
      if ((item.warehouse_ref.equals(warehouse._id))) {
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
    })


    // // Check if the product already exists in the cart
    if (cartProduct) {
      // If the product is already in the cart, update the quantity
      user.cart_products = user.cart_products.map((item) => {
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
      }).filter(item => item !== null);
    }
    await product.save();
    user.cart_added_date = new Date();
    const savedUser = await user.save();
    return res.status(201).json({ message: "Cart-Product Quantity decreased", data: savedUser });

  } catch (error) {
    console.error("Error increase product to cart:", error);
    return res.status(500).json({ message: "Error decrease product to cart", error: error.message });
  }
}
exports.userSelectedAddressChange = async (req, res) => {
  try {
    const { userId, Address } = req.body;
    const user = await User.findOneAndUpdate({ UID: userId }, { selected_Address: Address }, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const response = await cartUpdateOnAddressChange(Address.pincode, userId);


    return res.status(200).json({ message: "Address changed successfully and CartData Updated", data: response });
  } catch (error) {
    console.error("Error changing address:", error);
    return res.status(500).json({ message: "Error changing address", error: error.message });
  }
}
//functon to handle cart address change
const cartUpdateOnAddressChange = async (pincode, userId) => {
  try {
    const user = await User.findOne({ UID: userId })
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await Promise.all(user.cart_products.map(async (prodItem) => {
      const product = await Product.findById(prodItem.product_ref);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const warehouse = await Warehouse.findOne({ picode: prodItem.pincode });
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found for this variant" });
      }
      const variation = product.variations.find((item) => item._id.equals(prodItem.variant._id));
      if (!variation) {
        return res.status(404).json({ message: "variation not found for this product" });
      }
      variation.stock.map((item) => {
        if ((item.warehouse_ref.equals(warehouse._id))) {
          if (prodItem.inStock !== false) {
            item.stock_qty += Number(prodItem.quantity);
          }
        }
      })

      const newWarehouse = await Warehouse.findOne({ picode: pincode });
      if (!newWarehouse) {
        return res.status(404).json({ message: "Warehouse not found for this variant" });
      }
      const newVariation = product.variations.find((item) => item._id.equals(prodItem.variant._id));
      if (!newVariation) {
        return res.status(404).json({ message: "variation not found for this product" });
      }
      let warehouseFound = false;
      newVariation.stock.map((item) => {
        if ((item.warehouse_ref.equals(newWarehouse._id))) {
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
            prodItem.selling_price = prodItem.quantity * newVariation.selling_price;
            prodItem.mrp = prodItem.quantity * newVariation.MRP;
            prodItem.buying_price = prodItem.quantity * newVariation.buying_price;
            prodItem.final_price = prodItem.quantity * newVariation.selling_price;
            prodItem.cart_added_date = new Date();
            if (item.stock_qty == 0) {
              item.visibility = false;
            }
          }
        }
      })
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

    }))

    user.cart_added_date = new Date();
    const savedUser = await user.save();
    return savedUser;
  } catch (error) {
    console.log(error)
  }

}
exports.getUserCartById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ UID: userId })
    .populate({
        path: "cart_products.product_ref",
        populate: [
            { path: "category_ref", model: "Category" },  // Populate category for the product
            { 
                path: "sub_category_ref",
                model: "SubCategory",
                populate: { path: "category_ref", model: "Category" } // Populate category inside sub-category
            },
            { path: "Brand", model: "Brand" }, 
        ]
    })
    .populate({
        path: "whishlist.product_ref",
        populate: [
            { path: "category_ref", model: "Category" },  // Populate category for the product
            { 
                path: "sub_category_ref",
                model: "SubCategory",
                populate: { path: "category_ref", model: "Category" } // Populate category inside sub-category
            },
            { path: "Brand", model: "Brand" }, 
        ]
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cartProducts = await Promise.all(user.cart_products.map(async (prodItem) => {
      const product = await Product.findById(prodItem.product_ref._id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      console.log("product", product);
      const warehouse = await Warehouse.findOne({ picode: prodItem.pincode });
      console.log("warehouse", warehouse);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found for this variant" });
      }
      const variation = product.variations.find((item) => item._id.equals(prodItem.variant._id));
      console.log("variation", variation);
      if (!variation) {
        return res.status(404).json({ message: "variation not found for this product" });
      }
      console.log("prodItem", prodItem);
      let warehouseFound = false;
      variation.stock.map((item) => {
        if ((item.warehouse_ref.equals(warehouse._id))) {
          warehouseFound = true;
          prodItem.selling_price = variation.selling_price * Number(prodItem.quantity);
          prodItem.mrp = variation.MRP * Number(prodItem.quantity);
          prodItem.buying_price = variation.buying_price * Number(prodItem.quantity);
          prodItem.final_price = variation.selling_price * Number(prodItem.quantity);
        }
      })
      if (!warehouseFound) {
        prodItem.inStock = false;
        prodItem.selling_price = 0;
        prodItem.mrp = 0;
        prodItem.buying_price = 0;
        prodItem.final_price = 0;
        prodItem.variation_visibility = false;
      }



    }));
    const userData = (await user.save());
    return res.status(200).json({ message: "success", user: userData, cartProducts: userData.cart_products,whishlist:userData.whishlist });
  } catch (error) {
    console.log(error)
  }
}
exports.userStats = async (req, res) => {
  try {
    const user = await User.find();
    const allUsers = user.length;
    const totaUsers = await User.countDocuments({ isUser: true });
    const totalDeliveryBoy = await User.countDocuments({ is_deliveryboy: true });
    const totalWarehouse = await User.countDocuments({ isWarehouse: true });

    return res.status(200).json({ message: "success", allUsers: allUsers, totalUsers: totaUsers, totalDeliveryBoy: totalDeliveryBoy, totalWarehouse: totalWarehouse });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Error", error });
  }
}
exports.updateCurrentPincode = async (req, res) => {
  try {
    const { userId, pincode } = req.body;
    const user = await User.findOne({ UID: userId });
    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }
    user.current_pincode = pincode;
    const savedUser = await user.save();
    return res.status(200).json({ success: true, message: "current pincode updated", user: savedUser });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, message: "Error", error: error.message });
  }
}
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
    console.log(error)
    return res.status(500).json({ message: "Error", error });
  }
}
exports.removeSearchHistoryByUserIdandQueryId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const queryId = req.params.queryId;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const searchHistory = user.search_history;
    const updatedSearchHistory = searchHistory.filter((item) => item._id.toString() !== queryId);
    user.search_history = updatedSearchHistory;
    const savedUser = await user.save();
    return res.status(200).json({ message: "success", user: savedUser, searchHistory: savedUser.search_history });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Error", error });
  }
}

exports.removeSearchHistoryByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.search_history = [];
    const savedUser = await user.save();
    return res.status(200).json({ message: "success", user: savedUser, searchHistory: savedUser.search_history });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Error", error });
  }
}
exports.addProductToWhislist = async (req, res) => {
  try {
    const { userId, product_ref, variant } = req.body;
    const user = await User.findOne({ UID: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const cartProduct = user.cart_products.find((item) => item.product_ref == product_ref && item.variant._id == variant);
    const product = await Product.findById(product_ref);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const warehouse = await Warehouse.findOne({ picode: cartProduct.pincode });
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found for this variant" });
    }

    const variation = product.variations.find((item) => item._id.equals(cartProduct.variant._id));
    if (!variation) {
      return res.status(404).json({ message: "variation not found for this product" });
    }

    variation.stock.map((item) => {
      if ((item.warehouse_ref.equals(warehouse._id))) {
        const stockQty = item.stock_qty;

        item.stock_qty += Number(cartProduct.quantity);
        if (item.stock_qty == 0) {
          item.visibility = false;
        }

      }
    })
    user.cart_products = user.cart_products.filter((item) => {
      return (!(item.product_ref != product_ref)) && (!(item.variant._id != variant))
    });

    const exists = user.whishlist.some(item => item.product_ref === product_ref && item.variant_id === variant);

    if (!exists) {

      user.whishlist.push({
        product_ref: product_ref,
        variant_id: variant,
      });
    }
    const savedUser = await user.save();
    return res.status(200).json({ message: "success", user: savedUser,  wishlist: savedUser.whishlist });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Error", error });
  }
}
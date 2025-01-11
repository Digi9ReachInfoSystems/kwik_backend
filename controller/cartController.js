// const Cart = require("../models/cart_model"); // Import Cart model
// const mongoose = require('mongoose');
// const express = require("express");
// const Product = require('../models/product_model');


// exports.getcart = async (req, res) => {
//     try {
//         const cart = await Cart.findOne().populate('products.product'); // Populate product details
//         res.status(200).json(cart);
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching cart items", error });
//     }
// };

// exports.addtocart = async (req, res) => {
//     const { productId } = req.body;

//     try {
//         const product = await Product.findById(productId); // Find the product
//         if (!product) return res.status(404).json({ message: "Product not found" });

//         let cart = await Cart.findOne(); // Find the cart (assuming a single cart for simplicity)
//         if (!cart) {
//             cart = await Cart.create({ products: [], totalProfit: 0, totalOrderValue: 0 });
//         }

//         const cartItem = cart.products.find(item => item.product.toString() === productId);

//         if (!cartItem) {
//             // Add product to cart with quantity 1
//             cart.products.push({ product: productId, quantity: 1 });

//             // Update totals
//             cart.totalOrderValue += product.price;
//             cart.totalProfit += product.profit;

//             await cart.save();
//             res.status(200).json({ message: "Product added to cart", cart });
//         } else {
//             res.status(400).json({ message: "Product already in cart. Use the update endpoint to modify quantity." });
//         }
//     } catch (error) {
//         res.status(500).json({ message: "Error adding product to cart", error });
//     }
// };

// exports.increateqty = async (req, res) => {
//     const { productId } = req.body;

//     try {
//         const product = await Product.findById(productId); // Find the product
//         if (!product) return res.status(404).json({ message: "Product not found" });

//         let cart = await Cart.findOne();
//         if (!cart) return res.status(404).json({ message: "Cart not found" });

//         const cartItem = cart.products.find(item => item.product.toString() === productId);

//         if (cartItem) {
//             // Increment quantity by 1
//             cartItem.quantity += 1;

//             // Recalculate totals
//             cart.totalOrderValue = cart.products.reduce((sum, item) => sum + item.quantity * product.price, 0);
//             cart.totalProfit = cart.products.reduce((sum, item) => sum + item.quantity * product.profit, 0);

//             await cart.save();
//             res.status(200).json({ message: "Product quantity increased successfully", cart });
//         } else {
//             res.status(404).json({ message: "Product not found in cart" });
//         }
//     } catch (error) {
//         res.status(500).json({ message: "Error updating cart", error });
//     }
// };

// exports.decreaseqty = async (req, res) => {
//     const { productId } = req.body;

//     try {
//         const product = await Product.findById(productId); // Find the product
//         if (!product) return res.status(404).json({ message: "Product not found" });

//         let cart = await Cart.findOne();
//         if (!cart) return res.status(404).json({ message: "Cart not found" });

//         const cartItem = cart.products.find(item => item.product.toString() === productId);

//         if (cartItem) {
//             cartItem.quantity -= 1;

//             // Remove product if quantity is less than 1
//             if (cartItem.quantity < 1) {
//                 cart.products = cart.products.filter(item => item.product.toString() !== productId);
//             }

//             // Recalculate totals
//             cart.totalOrderValue = cart.products.reduce((sum, item) => sum + item.quantity * product.price, 0);
//             cart.totalProfit = cart.products.reduce((sum, item) => sum + item.quantity * product.profit, 0);

//             await cart.save();
//             res.status(200).json({ message: "Product quantity decreased successfully", cart });
//         } else {
//             res.status(404).json({ message: "Product not found in cart" });
//         }
//     } catch (error) {
//         res.status(500).json({ message: "Error updating cart", error });
//     }
// };
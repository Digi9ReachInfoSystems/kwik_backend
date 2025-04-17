const OrderRoute = require("../models/orderRoute_model");
const mongoose = require("mongoose");
const User = require("../models/user_models");




exports.createOrderRoute = async (req, res) => {
    try {
    

    } catch (err) {
        console.error("Error creating order route:", err);
        res.status(500).json({ message: "Failed to create order route", error: err.message });
    }
};

const express = require("express");
const router = express.Router();
const orderController = require("../controller/order_controller");

// Create a new order
router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.get("/user/:userId", orderController.getOrderByUserId);
router.put("/:id", orderController.updateOrder);
router.get("/warehouse/:pincode", orderController.getOrdersByWarehouseId);



module.exports = router;
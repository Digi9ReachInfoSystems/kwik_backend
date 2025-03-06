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
router.get("/stats/orderCount", orderController.getWeeklyOrdersByMonthAndYear);
router.get("/stats/orderRevenue", orderController.getMonthlyRevenueByYear);
router.get("/get/warehouse/:warehouse_id/status/:order_status", orderController.getOrderByWarehouseAndStatus);
router.get("/getWarehouseId/:warehouse_id", orderController.getOrdersByWarehouseId);
router.delete("/deleteOrder/:id", orderController.deleteOrderById);
router.get("/getDeliveredOrdersByWarehouseId/:warehouseId", orderController.getDeliveredOrderByWarehouseId);

module.exports = router;
const express = require("express");
const router = express.Router();
const orderController = require("../controller/order_controller");

// Create a new order
router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.get("/user/:userId", orderController.getOrderByUserId);
router.put("/:id", orderController.updateOrder);
router.get("/warehouse/:pincode", orderController.getOrdersByWarehouse);
router.get("/stats/orderCount", orderController.getWeeklyOrdersByMonthAndYear);
router.get("/stats/orderRevenue", orderController.getMonthlyRevenueByYear);
router.get("/get/warehouse/:warehouse_id/status/:order_status", orderController.getOrderByWarehouseAndStatus);
router.get("/getWarehouseId/:warehouse_id", orderController.getOrdersByWarehouseId);
router.delete("/deleteOrder/:id", orderController.deleteOrderById);
router.get("/getDeliveredOrdersByWarehouseId/:warehouseId", orderController.getDeliveredOrderByWarehouseId);
router.get("/get/orderbyStatus/:status", orderController.getOrdersByStatus);
router.get("/get/deliveredOrderStatsByWarehouseYearly",orderController.getOrderStatsByWareHouseYear)
router.get("/get/deliveredOrderStatsByYearly",orderController.getOrderStatsByYear)
router.get("/get/orderStatsByMonth",orderController.getWeeklyDeliveredOrderCount)
router.get("/search/order",orderController.searchOrderBycustomerName)
router.get("/search/orderbywarehouse/:warehouseId",orderController.searchOrderByWarehouseCustomerName)
router.get("/stats/orderRevenueAdmin", orderController.getMonthlyRevenueByYearAdmin);
router.get("/recent/orders", orderController.getRecentOrders);
router.get("/stats/orderCountAdmin", orderController.getMonthlyOrderCount);
router.get("/topSellingProducts/byWarehouse", orderController.getTopSellingProducts);
router.get("/recent/orders/:warehouseId", orderController.getRecentOrdersBywarehouseId);
router.get("/search/orderbywarehouse/:warehouseId/:status",orderController.searchOrderBycustomerNameStatus)
module.exports = router;
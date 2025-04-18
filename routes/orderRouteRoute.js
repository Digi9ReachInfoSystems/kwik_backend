const express = require("express");
const router = express.Router();
const orderRoutecontroller = require("../controller/orderRouteController");


router.post("/generate/byWarehouse/:warehouseId/:delivery_type", orderRoutecontroller.createOrderRoute);
router.post("/assignDeliveryBoys", orderRoutecontroller.assignDeliveryBoys);

module.exports = router;
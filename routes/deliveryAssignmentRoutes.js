const express = require("express");
const router = express.Router();
const deliveryAssignmentController = require("../controller/deliveryAssignmentController");

router.get("/getDeliveryAssignmentByDeliveryBoyId/:deliveryBoyId", deliveryAssignmentController.getOrdersByDeliveryBoy);


module.exports = router;
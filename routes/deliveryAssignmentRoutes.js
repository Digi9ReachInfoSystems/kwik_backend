const express = require("express");
const router = express.Router();
const deliveryAssignmentController = require("../controller/deliveryAssignmentController");

router.get(
  "/getDeliveryAssignmentByDeliveryBoyId/:deliveryBoyId",
  deliveryAssignmentController.getOrdersByDeliveryBoy
);
router.patch("/deliverOrder", deliveryAssignmentController.deliverOrder); //STATUS CHANGE DELIVERED
router.post("/assignDeliveryBoysSingle", deliveryAssignmentController.assignSingleOrder);

module.exports = router;

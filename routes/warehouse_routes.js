const express = require('express');
const router = express.Router();
const warehouseController = require('../controller/warehouse_controller'); // Adjust the path as needed


// Get all warehouse
router.get('/allwarehouse', warehouseController.getAllWarehouses);

// Add a new warehouse
router.post('/add', warehouseController.addWarehouse);

// Edit an existing warehouse
router.put('/edit/:id', warehouseController.editWarehouse);

// Delete a warehouse
router.delete('/delete/:id', warehouseController.deleteWarehouse);

router.get("/getById/:id", warehouseController.getWarehouseId);
router.post("/addDeliveryBoy", warehouseController.addDeliveryBoys);
router.get("/getDeliveryBoyStats", warehouseController.getDeliveryBoysStats);
router.get("/get/warehouseByUID/:UID", warehouseController.getWarehouseByUID);
router.get("/warehouseStats", warehouseController.getWarehouseStats);
router.get("/search/warehouse",warehouseController.searchWarehouse)
router.get("/get/warehouseStatus/:pincode",warehouseController.getWarehouseStatus);
router.get("/search/userByWarehouse/:warehouseId",warehouseController.searchUserByWarehouse);
router.get("/get/warehouseByPincode/:pincode",warehouseController.getWarehousesBypincode);
router.post("/warehouseServiceStatus",warehouseController.getDeliveryServiceStatus);
router.get("/get/DeliveryBoys/:warehouseId",warehouseController.getDeliveryBoys);
router.get("/get/warehouseProductCount/:warehouseId",warehouseController.getWarehouseProductCounts);
module.exports = router;

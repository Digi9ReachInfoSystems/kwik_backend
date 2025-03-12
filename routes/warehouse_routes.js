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
module.exports = router;

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

module.exports = router;

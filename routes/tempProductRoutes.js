const express = require('express');
const multer = require('multer');
const path = require('path');
const tempProductController = require('../controller/tempProductController');

const router = express.Router();
const upload = multer({
    //   dest: path.join(__dirname, '../tmp'),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post(
    '/bulk-upload',
    upload.single('file'),
    tempProductController.bulkUploadProducts
);
router.post("/migrate-products", tempProductController.migrateTempToProduct);
router.get("/allTempProducts", tempProductController.getAllTempProducts);
router.get("/getSingleTempProduct/:productId", tempProductController.getTempProductsById);
router.put("/updateTempProduct/:productId", tempProductController.updateTempProduct);
router.delete("/deleteTempProduct/:productId", tempProductController.deleteTempProduct);
router.get("/searchTempProduct", tempProductController.searchTempProduct);

module.exports = router;

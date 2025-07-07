const express = require('express');
const multer = require('multer');
const path = require('path');
const tempProductController = require('../controller/tempProductController');

const router = express.Router();
const upload = multer({
    //   dest: path.join(__dirname, '../tmp'),
    limits: { fileSize: 1024 * 1024 * 1024 }
});

router.post(
    '/bulk-upload',
    upload.fields([
        { name: 'csv', maxCount: 1 },      // Single CSV file (Buffer)
        { name: 'upload_photos', maxCount: 10 },  // Up to 10 photos (Buffers)
        { name: 'upload_video', maxCount: 3 },   // Up to 3 videos (Buffers)
    ]),
    tempProductController.bulkUploadProducts
);
router.post("/migrate-products", tempProductController.migrateTempToProduct);
router.get("/allTempProducts", tempProductController.getAllTempProducts);
router.get("/getSingleTempProduct/:productId", tempProductController.getTempProductsById);
router.put("/updateTempProduct/:productId", tempProductController.updateTempProduct);
router.delete("/deleteTempProduct/:productId", tempProductController.deleteTempProduct);
router.get("/searchTempProduct", tempProductController.searchTempProduct);

module.exports = router;

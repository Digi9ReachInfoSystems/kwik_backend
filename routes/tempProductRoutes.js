const express = require('express');
const multer  = require('multer');
const path    = require('path');
const ctrl    = require('../controller/tempProductController');

const router = express.Router();
const upload = multer({
  dest: path.join(__dirname, '../tmp'),
  limits: { fileSize: 5 * 1024 * 1024 }  // 5 MB max
});

// POST /products/bulk-upload
// Form field name: "file" (the CSV)
router.post(
  '/bulk-upload',
  upload.single('file'),
  ctrl.bulkUploadProducts
);

module.exports = router;

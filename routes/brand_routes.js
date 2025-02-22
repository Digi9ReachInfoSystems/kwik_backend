const express = require('express');
const router = express.Router();
const brandController = require('../controller/brand_controller');


// Get all brand
router.get('/allbrands', brandController.getAllBrands);
router.get("/:id", brandController.getBrandById);
// Add a new brand
router.post('/add', brandController.addBrand);

// Edit an existing brand
router.put('/edit/:id', brandController.editBrand);

// Delete a brand
router.delete('/delete/:id', brandController.deleteBrand);
router.delete('/softDelete/:id', brandController.softDeleteBrand);

module.exports = router;

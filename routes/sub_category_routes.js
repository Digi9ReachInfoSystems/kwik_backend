const express = require('express');
const router = express.Router();
const subCategoryController = require('../controller/sub_category_controller'); // Adjust path as needed

// Get all sub-category
router.get('/allsubcategories', subCategoryController.getAllSubCategories);

// Add a new sub-category
router.post('/add', subCategoryController.addSubCategory);

// Edit an existing sub-category
router.put('/edit/:id', subCategoryController.editSubCategory);

// Delete a sub-category
router.delete('/delete/:id', subCategoryController.deleteSubCategory);

module.exports = router;

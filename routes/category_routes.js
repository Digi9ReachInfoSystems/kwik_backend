const express = require('express');
const router = express.Router();
const categoryController = require('../controller/category_controller'); // Adjust path as needed


// Get all category
router.get('/allcategories', categoryController.getAllCategories);


// Add a new category
router.post('/add', categoryController.addCategory);

// Edit an existing category
router.put('/edit/:id', categoryController.editCategory);

// Delete a category
router.delete('/delete/:id', categoryController.deleteCategory);

module.exports = router;

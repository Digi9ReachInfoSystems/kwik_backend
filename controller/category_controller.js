const Category = require('../models/category_model'); // Adjust path as per your file structure

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find(); // Fetch all categories from the database

        res.status(200).json({ message: 'Categories retrieved successfully', data: categories });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

// Add a new category
exports.addCategory = async (req, res) => {
    try {
        const { category_id, category_name, category_des, category_image } = req.body;

        // Validate required fields
        if (!category_id || !category_name || !category_des || !category_image) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newCategory = new Category({
            category_id,
            category_name,
            category_des,
            category_image,
        });

        const savedCategory = await newCategory.save();

        res.status(201).json({ message: 'Category added successfully', data: savedCategory });
    } catch (error) {
        res.status(500).json({ message: 'Error adding category', error: error.message });
    }
};

// Edit an existing category
exports.editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id; // MongoDB Object ID of the category to edit
        const updatedData = req.body;

        const updatedCategory = await Category.findByIdAndUpdate(categoryId, updatedData, {
            new: true, // Return the updated document
            runValidators: true, // Run validation on updated fields
        });

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ message: 'Category updated successfully', data: updatedCategory });
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id; // MongoDB Object ID of the category to delete

        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ message: 'Category deleted successfully', data: deletedCategory });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
};

const Category = require("../models/category_model"); // Adjust path as per your file structure
const Product = require("../models/product_model"); // Assuming there is a Product model where category_ref is used
const mongoose = require("mongoose");
const SubCategory = require("../models/sub_category_model");

// Helper function to validate URLs
const isValidUrl = (url) => {
  const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return regex.test(url);
};

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }); // Fetch all categories from the database
    res.status(200).json(categories); // Send only the categories array
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};

// Get a category by category_id
exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id; // The category_id to search for

    // Find category by category_id
    const category = await Category.findOne({ _id: categoryId });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json(category); // Directly return the category data
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching category by id", message: error.message });
  }
};

// Add a new category
exports.addCategory = async (req, res) => {
  try {
    const {
      category_id,
      category_name,
      category_des,
      category_image,
      visibility,
      color,
      category_banner_image,
    } = req.body;
    // Validate required fields
    if (
      !category_id ||
      !category_name ||
      !category_des ||
      !category_image ||
      !visibility ||
      !color ||
      !category_banner_image
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    // Validate data types and URLs
    if (
      typeof category_id !== "string" ||
      typeof category_name !== "string" ||
      typeof category_des !== "string" ||
      typeof visibility !== "boolean" ||
      typeof color !== "string" ||
      typeof category_banner_image !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Invalid data type for one of the fields" });
    }

    if (!isValidUrl(category_image)) {
      return res.status(400).json({ message: "Invalid image URL" });
    }

    // Ensure unique category_id
    const existingCategory = await Category.findOne({ category_id });
    if (existingCategory) {
      return res.status(400).json({ message: "Category ID already exists" });
    }

    const newCategory = new Category({
      category_id,
      category_name,
      category_des,
      category_image,
      visibility,
      color,
      category_banner_image
    });

    const savedCategory = await newCategory.save();
    res
      .status(201)
      .json({ message: "Category added successfully", data: savedCategory });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding category", error: error.message });
  }
};

// Edit an existing category
exports.editCategory = async (req, res) => {
  try {
    const categoryId = new mongoose.Types.ObjectId(req.params.id); // MongoDB Object ID of the category to edit
    const updatedData = req.body;

    // Validate data types and URLs
    if (
      updatedData.category_name &&
      typeof updatedData.category_name !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Invalid data type for category_name" });
    }

    if (
      updatedData.category_des &&
      typeof updatedData.category_des !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Invalid data type for category_des" });
    }

    if (updatedData.category_image && !isValidUrl(updatedData.category_image)) {
      return res.status(400).json({ message: "Invalid image URL" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updatedData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run validation on updated fields
      }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating category", error: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; // MongoDB Object ID of the category to delete

    // Check if the category is used in any product
    const productWithCategory = await Product.findOne({
      category_ref: categoryId,
    });
    if (productWithCategory) {
      return res.status(400).json({
        message: "Category is being used in a product and cannot be deleted",
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: error.message });
  }
};

exports.softDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const products = await Product.find({ category_ref: category._id, isDeleted: false });
    if (products.length > 0) {
      return res.status(200).json({ message: "Category is being used in a product and cannot be soft deleted" });
    }
    const subCategories = await SubCategory.find({ category_ref: category._id, isDeleted: false });
    if (subCategories.length > 0) {
      return res.status(200).json({ message: "Category is being used in a sub-category and cannot be soft deleted" });
    }
    category.isDeleted = true;
    const updatedCategory = await category.save();
    res.status(200).json({ message: "Category soft deleted successfully", data: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: "Error soft deleting category", error: error.message });
  }
};

exports.searchCategory = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Search term is required" });
    }


    const categories = await Category.find({ category_name: { $regex: `${name}`, $options: "i" }, isDeleted: false });
    if (categories.length === 0) {
      return res.status(404).json({ success: false, message: "No categories found", data: categories });
    }

    res.status(200).json({ success: true, message: "Categories retrieved successfully", data: categories });
  } catch (error) {
    res.status(500).json({ message: "Error searching categories", error: error.message });
  }
};

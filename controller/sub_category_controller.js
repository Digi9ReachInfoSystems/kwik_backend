const SubCategory = require("../models/sub_category_model"); // Adjust path as per your file structure
const Category = require("../models/category_model"); // Import category model to validate category_ref
const Product = require("../models/product_model"); // Import product model to check product association

// Get all sub-categories
exports.getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find(); // Fetch all sub-categories from the database
    res.status(200).json(subCategories); // Send only the subcategories array
  } catch (error) {
    console.error("Error fetching sub-categories:", error.message); // Log error for debugging
    res
      .status(500)
      .json({ message: "Error fetching sub-categories", error: error.message });
  }
};

// Add a new sub-category with category_ref validation
exports.addSubCategory = async (req, res) => {
  try {
    const {
      sub_category_id,
      category_ref,
      sub_category_name,
      sub_category_des,
      sub_category_image,
    } = req.body;

    // Validate required fields
    if (
      !sub_category_id ||
      !category_ref ||
      !sub_category_name ||
      !sub_category_des ||
      !sub_category_image
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if the category_ref exists in the Category collection
    const categoryExists = await Category.findById(category_ref);
    if (!categoryExists) {
      return res.status(400).json({
        message:
          "Invalid category_ref. The referenced category does not exist.",
      });
    }

    // Create and save the new sub-category
    const newSubCategory = new SubCategory({
      sub_category_id,
      category_ref,
      sub_category_name,
      sub_category_des,
      sub_category_image,
    });

    const savedSubCategory = await newSubCategory.save();

    res.status(201).json({
      message: "Sub-category added successfully",
      data: savedSubCategory,
    });
  } catch (error) {
    console.error("Error adding sub-category:", error.message); // Log error for debugging
    res
      .status(500)
      .json({ message: "Error adding sub-category", error: error.message });
  }
};

// Edit a sub-category
exports.editSubCategory = async (req, res) => {
  try {
    const { id } = req.params; // Sub-category ID to update
    const updates = req.body; // Updated fields

    // Check if the sub-category exists
    const subCategoryExists = await SubCategory.findById(id);
    if (!subCategoryExists) {
      return res.status(404).json({ message: "Sub-category not found" });
    }

    // Update the sub-category
    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    res.status(200).json({
      message: "Sub-category updated successfully",
      data: updatedSubCategory,
    });
  } catch (error) {
    console.error("Error updating sub-category:", error.message); // Log error for debugging
    res
      .status(500)
      .json({ message: "Error updating sub-category", error: error.message });
  }
};

// Delete a sub-category with product association check
exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params; // Sub-category ID to delete

    // Check if the sub-category exists
    const subCategoryExists = await SubCategory.findById(id);
    if (!subCategoryExists) {
      return res.status(404).json({ message: "Sub-category not found" });
    }

    // Check if any products are associated with this sub-category
    const associatedProducts = await Product.find({ sub_category_ref: id });
    if (associatedProducts.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete sub-category. Products are associated with this sub-category.",
      });
    }

    // Delete the sub-category
    await SubCategory.findByIdAndDelete(id);

    res.status(200).json({ message: "Sub-category deleted successfully" });
  } catch (error) {
    console.error("Error deleting sub-category:", error.message); // Log error for debugging
    res
      .status(500)
      .json({ message: "Error deleting sub-category", error: error.message });
  }
};

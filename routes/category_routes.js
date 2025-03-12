const express = require("express");
const router = express.Router();
const categoryController = require("../controller/category_controller"); // Adjust path as needed

// Get all category
router.get("/allcategories", categoryController.getAllCategories);
// get category by id
router.get("/:id", categoryController.getCategoryById);
// Add a new category
router.post("/add", categoryController.addCategory);

// Edit an existing category
router.put("/edit/:id", categoryController.editCategory);

// Delete a category
router.delete("/delete/:id", categoryController.deleteCategory);
router.delete("/softDelete/:id", categoryController.softDeleteCategory);
router.get("/search/category", categoryController.searchCategory);    

module.exports = router;

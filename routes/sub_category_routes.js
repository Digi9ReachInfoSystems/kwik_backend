const express = require("express");
const router = express.Router();
const subCategoryController = require("../controller/sub_category_controller"); // Adjust path as needed

// Get all sub-category
router.get("/allsubcategories", subCategoryController.getAllSubCategories);
//all sub-categoryby caregory_id
router.get(
  "/allsubcategories/:categoryRef",
  subCategoryController.getSubCategoriesByCategoryRef
);
router.get("/:id", subCategoryController.getSubCategorieById);
// Add a new sub-category
router.post("/add", subCategoryController.addSubCategory);

// Edit an existing sub-category
router.put("/edit/:id", subCategoryController.editSubCategory);

// Delete a sub-category
router.delete("/delete/:id", subCategoryController.deleteSubCategory);

//api to get subcategory by category name

router.get(
  "/getSubCategoriesByCategoryName/:categoryName",
  subCategoryController.getSubCategoriesByCategoryName
);
router.delete("/softDelete/:id", subCategoryController.softDeleteSubCategory);
router.get("/search/subcategory", subCategoryController.searchSubCategories);

module.exports = router;

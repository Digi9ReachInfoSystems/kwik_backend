const express = require("express");
const router = express.Router();
const ProductController = require("../controller/product_controller");

router.post("/addproduct", ProductController.createProduct);
router.get("/allproducts", ProductController.getAllProducts);
router.get("/:categoryId", ProductController.getProductsByCategory);
router.get("/subcategory/:subCategoryId", ProductController.getProductsBySubCategory);
router.get("/getSingle/:productId", ProductController.getProductById);
router.put("/update/:productId", ProductController.updateProduct);
router.delete("/:productId", ProductController.deleteProduct);
router.put("/updateStock/:productId", ProductController.updateStock);
router.post("/addReview/:productId", ProductController.addReview);
router.post(
  "/products-by-subcategories",
  ProductController.getProductsBySubCategories
);
router.get("/get/Drafts", ProductController.getDrafts);
router.get("/get/lowStockProduct", ProductController.getLowStockProducts);
router.get("/get/productsByPincode", ProductController.getProductsbyPincode);
router.get("/get/productsByBrand", ProductController.getProductByBrand);
router.put("/updateVariation", ProductController.updateVariation);
router.delete("/softDelete/:productId", ProductController.softDeleteProduct);  
router.delete("/soft/delete/variation", ProductController.softDeleteVariation);
router.get("/allproducts/warehouse/:warehouseId", ProductController.getAllProductsByWarehouse);
router.get("/get/drafts/warehouse/:warehouseId", ProductController.getDraftsByWarehouse);
router.get("/get/productsFilterwarehouseId/:categoryName/:subCategoryName/:warehouseId", ProductController.getProductsByWarehuseCategorySubCategory);
router.get("/get/productsFilterwarehouseName/:categoryName/:subCategoryName/:warehouseName", ProductController.getProductsByWarehuseCategorySubCategory);
router.get("/search/product", ProductController.searchProducts);

module.exports = router;

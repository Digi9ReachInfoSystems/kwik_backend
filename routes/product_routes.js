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
router.get("/get/productsByBrand/:brandId", ProductController.getProductByBrand);
router.put("/updateVariation", ProductController.updateVariation);
router.delete("/softDelete/:productId", ProductController.softDeleteProduct);
router.delete("/soft/delete/variation", ProductController.softDeleteVariation);
router.get("/allproducts/warehouse/:warehouseId", ProductController.getAllProductsByWarehouse);
router.get("/get/drafts/warehouse/:warehouseId", ProductController.getDraftsByWarehouse);
router.get("/get/productsFilterwarehouseId/:categoryName/:warehouseId/:subCategoryName", ProductController.getProductsByWarehuseCategorySubCategory);
router.get("/get/productsFilterwarehouseName/:categoryName/:warehouseName/:subCategoryName", ProductController.getProductsByWarehuseCategorySubCategory);
router.get("/search/product", ProductController.searchProducts);
router.get("/search/product/:warehouseId", ProductController.searchProductsByWarehouse);
router.put("/updateqcStatus/:productId", ProductController.updateQcStatus);
router.get("/get/productByQcStatus", ProductController.getProductsByQcStatus);
router.get("/get/draft/productsFilterwarehouseId/:categoryName/:warehouseId/:subCategoryName", ProductController.getDraftProductsByWarehuseCategorySubCategory);
router.get("/get/lowStock/productsFilterwarehouseId/:categoryName/:warehouseId/:subCategoryName", ProductController.getLowStockProductsByWarehuseCategorySubCategory);
router.get("/get/notInwarehouse/:warehouseId", ProductController.getProductNotInWarehouse);
router.post("/add/stockwithWarehouse",ProductController.addStockToExistingProduct);
router.get("/get/recommendedProducts/:userId", ProductController.getRecomandedProducts);
router.get("/search/lowStockProduct/:warehouseId", ProductController.searchLowStockProducts);
router.get("/search/draftProduct/:warehouseId", ProductController.searchDrafts);
router.get("/get/recommendedProductsByUserOrder/:userId", ProductController.getRecomandedProductsBasedOnOrders);
router.get("/search/product/user/:userId", ProductController.searchProductsbyUserId);
module.exports = router;

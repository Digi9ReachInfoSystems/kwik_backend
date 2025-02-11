const express = require("express");
const router = express.Router();
const ProductController = require("../controller/product_controller");

router.post("/addproduct", ProductController.createProduct);
router.get("/allproducts", ProductController.getAllProducts);
router.get("/:categoryId", ProductController.getProductsByCategory);
router.get("/subcategory/:subCategoryId", ProductController.getProductsBySubCategory);
router.get("/:productId", ProductController.getProductById);
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
module.exports = router;

const express = require("express");
const router = express.Router();
const categoryController = require("../controller/category_page_ui_controller"); // Adjust path as needed

// edit the home page categories
router.get("/getui", categoryController.getcategorypageWidget);
// router.put("/editui", categoryController.updateHomepageWidget);
router.post("/createui", categoryController.createcategorypageWidget);
module.exports = router;

const express = require("express");
const router = express.Router();
const categoryController = require("../controller/home_page_uicontroler"); // Adjust path as needed

// edit the home page categories
router.get("/getui", categoryController.getHomepageWidget);
router.put("/editui", categoryController.updateHomepageWidget);
router.post("/createui", categoryController.createHomepageWidget);
module.exports = router;

const express = require("express");
const router = express.Router();
const superSaverController = require("../controller/superSaver_page_ui_controller"); 

router.get("/getui", superSaverController.getSuperSaver);

module.exports = router;
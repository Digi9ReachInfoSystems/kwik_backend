const express = require("express");
const router = express.Router();
const superSaverController = require("../controller/superSaver_page_ui_controller"); 

router.get("/getui", superSaverController.getSuperSaver);
router.put("/editui", superSaverController.updateSuperSaver);

module.exports = router;
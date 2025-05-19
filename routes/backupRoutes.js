const express = require("express");
const router = express.Router();
const backupController = require("../controller/backupController");

router.post("/backup", backupController.backupToFirebase);
router.post("/restore", backupController.restoreFromFirebase);

module.exports = router;

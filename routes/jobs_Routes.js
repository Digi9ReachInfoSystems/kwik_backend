const express = require("express");
const router = express.Router();
const jobsController= require("../controller/jobs_Controller");

// cart removal job
router.get("/cartcleanupjob", jobsController.cartCleanupJobController);

module.exports = router;
const express = require('express');
const router = express.Router();
const cronJobController = require('../controller/cronJobController');

router.get('/run', cronJobController.runCronJob);

module.exports = router;
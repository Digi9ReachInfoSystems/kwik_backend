// routes/applicationManagementRoutes.js
const express = require('express');
const router = express.Router();
const applicationManagementController = require('../controller/applicationManagementController');

// Create settings
router.post('/settings', applicationManagementController.createSettings);

// Get settings
router.get('/settings', applicationManagementController.getSettings);

// Update settings
router.put('/settings', applicationManagementController.updateSettings);
router.get('/settings/cart', applicationManagementController.getSettingsCart);
router.get('/settings/versions', applicationManagementController.getSettingVersions);
router.put('/settings/contacts', applicationManagementController.updateSettingContacts);
router.put('/settings/charges', applicationManagementController.updateSettingCharges);
router.put('/settings/versions', applicationManagementController.updateSettingVersions);
router.put('/settings/general', applicationManagementController.updateSettingGeneral);
module.exports = router;

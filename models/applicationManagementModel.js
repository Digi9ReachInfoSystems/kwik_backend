// models/applicationManagementModel.js
const mongoose = require('mongoose');

// Define the schema for the settings
const applicationManagementSchema = new mongoose.Schema({
    contact_number: { type: String, required: false },
    support_contact_number: { type: String, required: false },
    email: { type: String, required: false },
    support_email: { type: String, required: false },
    contact_us: { type: String, required: false },
    privacy_policy: { type: String, required: false },
    terms_of_use: { type: String, required: false },
    enable_cod: { type: Boolean, required: false },
    delivery_charge: { type: Number, required: false },
    delivery_charge_tum_tum: { type: Number, required: false },
    handling_charge: { type: Number, required: false },
    high_demand_charge: { type: Number, required: false },
    new_version_ios: { type: Number, required: false },
    new_version_android: { type: Number, required: false },
    force_update_ios: { type: Number, required: false },
    force_update_android: { type: Number, required: false },
    new_update_image_android: { type: String, required: false },
    new_update_title_android: { type: String, required: false },
    new_update_des_android: { type: String, required: false },
    new_update_image_ios: { type: String, required: false },
    new_update_title_ios: { type: String, required: false },
    new_update_des_ios: { type: String, required: false },
    delivery_coverage_distance: { type: Number, required: false },
    route_point_threshold: { type: Number, required: false },
    enable_Instant_Delivery:{type: Boolean, required: false},

}, { modelName: 'ApplicationManagement' }); // Set model name to 'ApplicationManagement'

// Create the model
const ApplicationManagement = mongoose.model('ApplicationManagement', applicationManagementSchema);

module.exports = ApplicationManagement;

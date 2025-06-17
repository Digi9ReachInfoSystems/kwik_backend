// controllers/applicationManagementController.js
const ApplicationManagement = require('../models/applicationManagementModel');

// Create new settings
exports.createSettings = async (req, res) => {
    try {
        const newSettings = new ApplicationManagement({
            contact_number: req.body.contact_number,
            support_contact_number: req.body.support_contact_number,
            email: req.body.email,
            support_email: req.body.support_email,
            contact_us: req.body.contact_us,
            privacy_policy: req.body.privacy_policy,
            terms_of_use: req.body.terms_of_use,
            enable_cod: req.body.enable_cod,
            delivery_charge: req.body.delivery_charge,
            handling_charge: req.body.handling_charge,
            high_demand_charge: req.body.high_demand_charge,
            new_version_ios: req.body.new_version_ios,
            new_version_android: req.body.new_version_android,
            force_update_ios: req.body.force_update_ios,
            force_update_android: req.body.force_update_android,
            new_update_image_android: req.body.new_update_image_android,
            new_update_title_android: req.body.new_update_title_android,
            new_update_des_android: req.body.new_update_des_android,
            new_update_image_ios: req.body.new_update_image_ios,
            new_update_title_ios: req.body.new_update_title_ios,
            new_update_des_ios: req.body.new_update_des_ios,
        });

        await newSettings.save();
        return res.status(201).json({ message: 'Settings created successfully', newSettings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error creating settings', error: error.message });
    }
};

// Get the settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await ApplicationManagement.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        return res.status(200).json({ message: 'Settings retrieved successfully', data: settings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error retrieving settings', error: error.message });
    }
};

// Update the settings
exports.updateSettings = async (req, res) => {
    try {
        const existingSettings = await ApplicationManagement.findOne();
        if (!existingSettings) {
            return res.status(404).json({ message: 'Settings not found to update' });
        }
        const updatedSettings = await ApplicationManagement.findOneAndUpdate(
            {},  // Update the first (and usually only) settings document
            {
                contact_number: req.body.contact_number || existingSettings.contact_number,
                support_contact_number: req.body.support_contact_number || existingSettings.support_contact_number,
                email: req.body.email || existingSettings.email,
                support_email: req.body.support_email || existingSettings.support_email,
                contact_us: req.body.contact_us || existingSettings.contact_us,
                privacy_policy: req.body.privacy_policy || existingSettings.privacy_policy,
                terms_of_use: req.body.terms_of_use || existingSettings.terms_of_use,
                enable_cod: req.body.enable_cod || existingSettings.enable_cod,
                delivery_charge: req.body.delivery_charge || existingSettings.delivery_charge,
                delivery_charge_tum_tum: req.body.delivery_charge_tum_tum || existingSettings.delivery_charge_tum_tum,
                handling_charge: req.body.handling_charge || existingSettings.handling_charge,
                high_demand_charge: req.body.high_demand_charge || existingSettings.high_demand_charge,
                new_version_ios: req.body.new_version_ios || existingSettings.new_version_ios,
                new_version_android: req.body.new_version_android || existingSettings.new_version_android,
                force_update_ios: req.body.force_update_ios || existingSettings.force_update_ios,
                force_update_android: req.body.force_update_android || existingSettings.force_update_android,
                new_update_image_android: req.body.new_update_image_android || existingSettings.new_update_image_android,
                new_update_title_android: req.body.new_update_title_android || existingSettings.new_update_title_android,
                new_update_des_android: req.body.new_update_des_android || existingSettings.new_update_des_android,
                new_update_image_ios: req.body.new_update_image_ios || existingSettings.new_update_image_ios,
                new_update_title_ios: req.body.new_update_title_ios || existingSettings.new_update_title_ios,
                new_update_des_ios: req.body.new_update_des_ios || existingSettings.new_update_des_ios,
                delivery_coverage_distance: req.body.delivery_coverage_distance || existingSettings.delivery_coverage_distance,
                route_point_threshold: req.body.route_point_threshold || existingSettings.route_point_threshold,
                enable_Instant_Delivery: req.body.enable_Instant_Delivery || existingSettings.enable_Instant_Delivery,
            },
            { new: true }  // Return the updated document
        );

        if (!updatedSettings) {
            return res.status(404).json({ message: 'Settings not found to update' });
        }

        return res.status(200).json({ message: 'Settings updated successfully', updatedSettings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};
exports.getSettingsCart = async (req, res) => {
    try {
        const settings = await ApplicationManagement.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        const necessarySettings = {
            contact_number: settings.contact_number,
            support_contact_number: settings.support_contact_number,
            email: settings.email,
            support_email: settings.support_email,
            contact_us: settings.contact_us,
            privacy_policy: settings.privacy_policy,
            terms_of_use: settings.terms_of_use,
            enable_cod: settings.enable_cod,
            delivery_charge: settings.delivery_charge,
            handling_charge: settings.handling_charge,
            high_demand_charge: settings.high_demand_charge,

        }
        return res.status(200).json({ message: 'Settings retrieved successfully', data: necessarySettings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error retrieving settings', error: error.message });
    }
};

exports.getSettingVersions = async (req, res) => {
    try {
        const settings = await ApplicationManagement.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        const necessarySettings = {
            new_version_ios: settings.new_version_ios,
            new_version_android: settings.new_version_android,
            force_update_ios: settings.force_update_ios,
            force_update_android: settings.force_update_android,
            new_update_image_android: settings.new_update_image_android,
            new_update_title_android: settings.new_update_title_android,
            new_update_des_android: settings.new_update_des_android,
            new_update_image_ios: settings.new_update_image_ios,
            new_update_title_ios: settings.new_update_title_ios,
            new_update_des_ios: settings.new_update_des_ios,
        }
        return res.status(200).json({ message: 'Settings retrieved successfully', data: necessarySettings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error retrieving settings', error: error.message });
    }
};

exports.updateSettingContacts = async (req, res) => {
    try {
        const updatedSettings = await ApplicationManagement.findOneAndUpdate(
            {},  // Update the first (and usually only) settings document
            {
                contact_number: req.body.contact_number,
                support_contact_number: req.body.support_contact_number,
                email: req.body.email,
                support_email: req.body.support_email,
                contact_us: req.body.contact_us,
            },
            { new: true }  // Return the updated document
        );

        if (!updatedSettings) {
            return res.status(404).json({ message: 'Settings not found to update' });
        }

        return res.status(200).json({ message: 'Settings updated successfully', updatedSettings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};
exports.updateSettingCharges = async (req, res) => {
    try {
        const updatedSettings = await ApplicationManagement.findOneAndUpdate(
            {},  // Update the first (and usually only) settings document
            {
                delivery_charge: req.body.delivery_charge,
                handling_charge: req.body.handling_charge,
                high_demand_charge: req.body.high_demand_charge,
            },
            { new: true }  // Return the updated document
        );

        if (!updatedSettings) {
            return res.status(404).json({ message: 'Settings not found to update' });
        }

        return res.status(200).json({ message: 'Settings updated successfully', updatedSettings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};
exports.updateSettingVersions = async (req, res) => {
    try {
        const updatedSettings = await ApplicationManagement.findOneAndUpdate(
            {},  // Update the first (and usually only) settings document
            {
                new_version_ios: req.body.new_version_ios,
                new_version_android: req.body.new_version_android,
                force_update_ios: req.body.force_update_ios,
                force_update_android: req.body.force_update_android,
                new_update_image_android: req.body.new_update_image_android,
                new_update_title_android: req.body.new_update_title_android,
                new_update_des_android: req.body.new_update_des_android,
                new_update_image_ios: req.body.new_update_image_ios,
                new_update_title_ios: req.body.new_update_title_ios,
                new_update_des_ios: req.body.new_update_des_ios,
            },
            { new: true }  // Return the updated document
        );

        if (!updatedSettings) {
            return res.status(404).json({ message: 'Settings not found to update' });
        }

        return res.status(200).json({ message: 'Settings updated successfully', updatedSettings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};
exports.updateSettingGeneral = async (req, res) => {
    try {
        const updatedSettings = await ApplicationManagement.findOne();
        if (!updatedSettings) {
            return res.status(404).json({ message: 'Settings not found to update' });
        }
        updatedSettings.enable_cod = req.body.enable_cod || updatedSettings.enable_cod;
        updatedSettings.terms_of_use = req.body.terms_of_use || updatedSettings.terms_of_use;
        updatedSettings.privacy_policy = req.body.privacy_policy || updatedSettings.privacy_policy;
        updatedSettings.contact_us = req.body.contact_us || updatedSettings.contact_us;

        await updatedSettings.save();
        return res.status(200).json({ message: 'Settings updated successfully', updatedSettings });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};

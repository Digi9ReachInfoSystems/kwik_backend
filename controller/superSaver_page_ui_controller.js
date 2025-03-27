const SuperSaver = require("../models/superSaver_page_ui_model");


exports.getSuperSaver = async (req, res) => {
    try {
        const superSaver = await SuperSaver.findOne();
        if (!superSaver) {
            return res.status(404).json({ message: "SuperSaver not found" });
        }
        res.status(200).json(superSaver);
    } catch (error) {
        res.status(500).json({ message: "Error fetching SuperSaver data", error });
    }
};
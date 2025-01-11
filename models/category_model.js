const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    category_id: { type: String, required: true },
    category_name: { type: String, required: true },
    category_des: { type: String, required: true },
    category_image: { type: String, required: true },
    created_time: { type: Date, required: true, default: Date.now }
});

// Create and export the Category model
module.exports = mongoose.model("Category", categorySchema);

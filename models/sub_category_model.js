const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
    sub_category_id: { type: String, required: true },
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },  // Reference to the Category collection
    sub_category_name: { type: String, required: true },
    sub_category_des: { type: String, required: true },
    sub_category_image: { type: String, required: true },
    sub_created_time: { type: Date, required: true, default: Date.now }
});

// Create and export the SubCategory model
module.exports = mongoose.model("SubCategory", subCategorySchema);

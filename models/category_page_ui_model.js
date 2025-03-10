const mongoose = require("mongoose");

const categorypageWidgetSchema = new mongoose.Schema({
  template1: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },

    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template2: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template3: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template4: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template5: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template6: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template7: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template8: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template9: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template10: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template11: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template12: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template13: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template14: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
  template15: {
    category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    background_color: { type: String, required: true },
    title: { type: String, required: true },
    title_color: { type: String, required: true },
    category_ref: [
      { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    ],
    subcategory_title_color: { type: String, required: true },
    ui_order_number: { type: String, required: true },
    show_Category: { type: Boolean, required: true },
  },
});

const categorypageWidget = mongoose.model(
  "categorypageWidget",
  categorypageWidgetSchema
);

module.exports = categorypageWidget;

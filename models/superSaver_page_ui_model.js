const mongoose = require("mongoose");

const superSaverpageWidgetSchema = new mongoose.Schema({
  template1: Object,
  template2: Object, 
  template3:Object,
  template4: Object,
  template5: Object,
  template6: Object,
  template7: Object,
  template8: Object,
  template9: Object,
  template10: Object,
  template11: Object,
  template12: Object,
  template13: Object,
  template14: Object,
  template15: Object,
});

const superSaverpageWidget = mongoose.model(
  "SuperSaverpageWidget",
  superSaverpageWidgetSchema
);

module.exports = superSaverpageWidget;

// backup fields supersave UI

// template1: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },

//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template2: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template3: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template4: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template5: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template6: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template7: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template8: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template9: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template10: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template11: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template12: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template13: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template14: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },
// template15: {
//   category_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//   background_color: { type: String, required: true },
//   title: { type: String, required: true },
//   title_color: { type: String, required: true },
//   category_ref: [
//     { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
//   ],
//   subcategory_title_color: { type: String, required: true },
//   ui_order_number: { type: String, required: true },
//   show_Category: { type: Boolean, required: true },
// },

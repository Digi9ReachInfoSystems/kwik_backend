const CategorypageWidget = require("../models/category_page_ui_model");

// Controller function to get the single HomepageWidget document

exports.getcategorypageWidget = async (req, res) => {
  try {
    // Fetch the first document from the collection
    const categorypageWidget = await CategorypageWidget.findOne();

    if (!categorypageWidget) {
      return res.status(404).json(null); // Return null if not found
    }

    return res.status(200).json(categorypageWidget);
  } catch (error) {
    console.error("Error fetching homepage widget:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};
// Controller function to create a new HomepageWidget
exports.createcategorypageWidget = async (req, res) => {
  try {
    // Create a new HomepageWidget using the request body
    const categorypageWidget = new CategorypageWidget({
      template1: req.body.template1,
      template2: req.body.template2,
      template3: req.body.template3,
      template4: req.body.template4,
      template5: req.body.template5,
      template6: req.body.template6,
      template7: req.body.template7,
      template8: req.body.template8,
      template9: req.body.template9,
      template10: req.body.template10,
      template11: req.body.template11,
      template12: req.body.template12,
      template13: req.body.template13,
      template14: req.body.template14,
      template15: req.body.template15,
    });

    // Save the homepageWidget to the database
    const savedWidget = await categorypageWidget.save();

    // Respond with the saved widget data
    res.status(201).json({
      message: "categorypage Widget created successfully",
      data: savedWidget,
    });
  } catch (error) {
    console.error("Error creating categorypage widget:", error);
    res.status(500).json({
      message: "Error creating categorypage widget",
      error: error.message,
    });
  }
};

exports.updatecategorypageWidget = async (req, res) => {
  try {
    const { template, value } = req.body;

    const widget = await CategorypageWidget.findOne();

    if (!widget) {
      return res.status(404).json({ success: false, message: "Widget not found" });
    }
    if (!widget[template]) {
      return res.status(400).json({ success: false, message: `Template ${template} does not exist` });
    }

    widget[template] = {
      ...widget[template],
      ...value,
    };

    await widget.save();

    return res.status(200).json({
      success: true,
      message: "Widget updated successfully",
      data: widget,
    });
  } catch (error) {
    console.error("Error updating widget field:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating widget field",
      error: error.message,
    });
  }
}
const HomepageWidget = require("../models/home_page_ui");

// Controller function to get the single HomepageWidget document
exports.getHomepageWidget = async (req, res) => {
  try {
    // Fetch the first document from the collection
    const homepageWidget = await HomepageWidget.findOne();

    if (!homepageWidget) {
      return res.status(404).json(null); // Return null if not found
    }

    return res.status(200).json(homepageWidget);
  } catch (error) {
    console.error("Error fetching homepage widget:", error);
    res.status(500).json({
      error: error.message,
    });
  }
};
// Controller function to update a homepage widget
exports.updateHomepageWidget = async (req, res) => {
  try {
    const { widgetId } = req.params; // Assuming widget ID is passed in the URL
    const updateData = req.body; // Fields to update

    // Check if ui_order_number is being updated
    if (updateData.ui_order_number) {
      // Dynamically generate query to check all fields with ui_order_number
      const fieldsWithUiOrder = [
        "categorylist.ui_order_number",
        "template2.ui_order_number",
        "templateBanner3.ui_order_number",
        "template3.ui_order_number",
        "template4.ui_order_number",
        "template5.ui_order_number",
        "template6Brand1.ui_order_number",
        "template7.ui_order_number",
        "template8.ui_order_number",
        "template9.ui_order_number",
        "template10.ui_order_number",
        "template11.ui_order_number",
        "template12.ui_order_number",
        "template13Brand2.ui_order_number",
        "template14.ui_order_number",
        "template15.ui_order_number",
        "template16.ui_order_number",
        "template17.ui_order_number",
        "template18.ui_order_number",
        "template19Brand3.ui_order_number",
        "template20.ui_order_number",
        "template21.ui_order_number",
        "template22.ui_order_number",
        "template23.ui_order_number",
        "template24.ui_order_number",
        "template25.ui_order_number",
        "template26.ui_order_number",
        "template27.ui_order_number",
      ];

      // Generate query to check if ui_order_number is unique
      const query = fieldsWithUiOrder.reduce((acc, field) => {
        acc[field] = updateData.ui_order_number;
        return acc;
      }, {});

      // Check if ui_order_number is already used in any of the fields
      const isOrderNumberUnique = await HomepageWidget.find(query);

      // If the `ui_order_number` already exists, return an error
      if (isOrderNumberUnique.length > 0) {
        return res.status(400).json({
          message: "The UI order number is already taken by another template.",
        });
      }
    }

    // Find and update the homepage widget
    const updatedWidget = await HomepageWidget.findByIdAndUpdate(
      widgetId,
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Validate according to schema
      }
    );

    if (!updatedWidget) {
      return res.status(404).json({
        message: "Homepage widget not found.",
      });
    }

    return res.status(200).json({
      message: "Homepage widget updated successfully.",
      updatedWidget,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong while updating the homepage widget.",
      error: error.message,
    });
  }
};

// Controller function to create a new HomepageWidget
exports.createHomepageWidget = async (req, res) => {
  try {
    // Create a new HomepageWidget using the request body
    const homepageWidget = new HomepageWidget({
      categorylist: req.body.categorylist,
      template2: req.body.template2,
      templateBanner3: req.body.templateBanner3,
      template3: req.body.template3,
      template4: req.body.template4,
      template5: req.body.template5,
      template6Brand1: req.body.template6Brand1,
      template7: req.body.template7,
      template8: req.body.template8,
      template9: req.body.template9,
      template10: req.body.template10,
      template11: req.body.template11,
      template12: req.body.template12,
      template13Brand2: req.body.template13Brand2,
      template14: req.body.template14,
      template15: req.body.template15,
      template16: req.body.template16,
      template17: req.body.template17,
      template18: req.body.template18,
      template19Brand3: req.body.template19Brand3,
      template20: req.body.template20,
      template21: req.body.template21,
      template22: req.body.template22,
      template23: req.body.template23,
      template24: req.body.template24,
      template25: req.body.template25,
      templateBanner4: req.body.templateBanner4,
      template26: req.body.template26,
      template27: req.body.template27,
    });

    // Save the homepageWidget to the database
    const savedWidget = await homepageWidget.save();

    // Respond with the saved widget data
    res.status(201).json({
      message: "Homepage Widget created successfully",
      data: savedWidget,
    });
  } catch (error) {
    console.error("Error creating homepage widget:", error);
    res.status(500).json({
      message: "Error creating homepage widget",
      error: error.message,
    });
  }
};

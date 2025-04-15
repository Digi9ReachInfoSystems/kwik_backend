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

exports.updateWidgetTemplate = async (req, res) => {
  try {
    
    const {  template, value } = req.body;

    const widget = await HomepageWidget.findOne();

    if (!widget) {
      return res.status(404).json({ success: false, message: 'Widget not found' });
    }
    if (!widget[template]) {
      return res.status(400).json({ success: false, message: `Template ${template} does not exist` });
    }
   
    widget[template]={
      ...widget[template],
      ...value
    };
  
    await widget.save();

    return res.status(200).json({
      success: true,
      message: 'Widget updated successfully',
      data: widget,
    });
  } catch (error) {
    console.error('Error updating widget field:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating widget field',
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

const Banner = require("../models/banner_model"); // Assuming the model is located in the models folder
const Category = require("../models/category_model"); // Category model
const SubCategory = require("../models/sub_category_model"); // SubCategory model

// Get all banners
exports.getAllBanners = async (req, res) => {
  try {
    // Fetch all banners from the database
    const banners = await Banner.find()
      .populate("category_ref")
      .populate("sub_category_ref");

    return res.status(200).json(banners); // Just send the banners list directly
  } catch (error) {
    return res.status(500).json({ error: error.message }); // Only send error message if any
  }
};

// Get individual banner by banner_id
exports.getBannerById = async (req, res) => {
  const { banner_id } = req.params; // Assuming banner_id is passed in the URL

  try {
    // Find the banner by its banner_id
    const banner = await Banner.find({ banner_id:banner_id })
      .populate("category_ref")
      .populate("sub_category_ref");
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    return res
      .status(200)
      .json({ message: "Banner fetched successfully", banner });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Add a new banner
exports.addBanner = async (req, res) => {
  const { banner_id, banner_image, category_ref, sub_category_ref, order_id } =
    req.body;

  try {
    // Check if category exists
    const category = await Category.findById(category_ref);
    if (!category) {
      return res.status(400).json({ message: "Category does not exist" });
    }

    // If sub_category_ref is provided, check if it exists
    if (sub_category_ref) {
      const subCategory = await SubCategory.findById(sub_category_ref);
      if (!subCategory) {
        return res.status(400).json({ message: "Sub-category does not exist" });
      }
    }

    // Create a new banner
    const newBanner = new Banner({
      banner_id,
      banner_image,
      category_ref,
      sub_category_ref: sub_category_ref || null, // Set to null if not provided
      order_id,
    });

    // Save the banner to the database
    const banner = await newBanner.save();
    return res
      .status(201)
      .json({ message: "Banner created successfully", banner });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Edit an existing banner
exports.editBanner = async (req, res) => {
  const { id } = req.params; // Assuming banner_id is passed in the URL
  const { banner_image, category_ref, sub_category_ref, order_id } = req.body;

  try {
    // Find the banner by banner_id
    const banner = await Banner.findById(id );
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Optionally, check if the category and sub-category exist (if not already validated)
    const category = await Category.findById(category_ref);
    if (
      category
    ) {
      return res.status(404).json({ message: " category reference does not exist" });
    }

    const subCategory = await SubCategory.findById(sub_category_ref);
    if (
      subCategory 
    ) {
      return res
        .status(400)
        .json({ message: "Invalid sub-category reference" });
    }

    // Update the banner's properties
    banner.banner_image = banner_image || banner.banner_image;
    banner.category_ref = category_ref || banner.category_ref;
    banner.sub_category_ref = sub_category_ref || banner.sub_category_ref;
    banner.order_id = order_id || banner.order_id;

    // Save the updated banner
    const updatedBanner = await banner.save();
    return res
      .status(200)
      .json({ message: "Banner updated successfully", updatedBanner });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// Delete a banner
exports.deleteBanner = async (req, res) => {
  const { banner_id } = req.params; // Assuming banner_id is passed in the URL

  try {
    // Find and delete the banner by banner_id
    const banner = await Banner.findOneAndDelete({ banner_id });
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    return res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

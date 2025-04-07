const Brand = require("../models/brand_model"); // Adjust path as per your file structure
const Product = require("../models/product_model"); // Assuming you have a Product model

// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({isDeleted: false}); // Fetch all brands from the database
    res.status(200).json(brands); // Send only the brands array
  } catch (error) {
    res.status(500).json({ error: error.message }); // Simplified error response
  }
};

// Add a new brand
exports.addBrand = async (req, res) => {
  try {
    const {  brand_name, brand_image, brand_des, brand_url ,color} =
      req.body;

    // Validate required fields
    if ( !brand_name || !brand_image || !brand_des) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newBrand = new Brand({
      brand_name,
      brand_image,
      brand_des,
      brand_url,
      color
    });

    const savedBrand = await newBrand.save();
    res
      .status(201)
      .json({ message: "Brand added successfully", data: savedBrand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding brand", error: error.message });
  }
};

// Edit an existing brand
exports.editBrand = async (req, res) => {
  try {
    const brandId = req.params.id; // MongoDB Object ID of the brand to edit
    const updatedData = req.body;

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Run validation on updated fields
    });

    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res
      .status(200)
      .json({ message: "Brand updated successfully", data: updatedBrand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating brand", error: error.message });
  }
};

// Delete a brand
exports.deleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id; // MongoDB Object ID of the brand to delete

    // Check if the brand is being used in any product
    const productUsingBrand = await Product.findOne({ brand_ref: brandId });
    if (productUsingBrand) {
      return res.status(400).json({
        message: "Brand is being used in a product and cannot be deleted",
      });
    }

    const deletedBrand = await Brand.findByIdAndDelete(brandId);

    if (!deletedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res
      .status(200)
      .json({ message: "Brand deleted successfully", data: deletedBrand });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting brand", error: error.message });
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: "Error fetching brand", error: error.message });
  }
};
exports.softDeleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brand.findById(brandId);
    const products=await Product.find({Brand:brandId,isDeleted:false});
    if (products.length>0) {
      return res.status(200).json({ message: "Brand is being used in a product and cannot be soft deleted" });
    }
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    brand.isDeleted = true;
    const updatedBrand = await brand.save();
    res.status(200).json({ message: "Brand soft deleted successfully", data: updatedBrand });
  } catch (error) {
    res.status(500).json({ message: "Error soft deleting brand", error: error.message });
  }
};
exports.searchBrand = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    // Case-insensitive search for products whose names start with the provided term
    const brands = await Brand.find({
      brand_name: { $regex: `${name}`, $options: "i" },
      isDeleted: false
    });

    if (brands.length === 0) {
      return res.status(404).json({ success: false, message: "No brands found", data: brands });
    }

    return res.status(200).json({ success: true, message: "Brands retrieved successfully", data: brands });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
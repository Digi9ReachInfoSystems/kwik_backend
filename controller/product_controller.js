const mongoose = require("mongoose");
const Product = require("../models/product_model");
const Category = require("../models/category_model")
const ZoneRack = require("../models/zoneRack_model");
const SubCategory = require("../models/sub_category_model");

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    let productData = req.body;

    // Validate required fields
    if (!productData.product_name || !productData.sku) {
      return res
        .status(400)
        .json({ message: "Product name and SKU are required" });
    }
    // Validate product name length
    if (productData.product_name.length < 3) {
      return res
        .status(400)
        .json({ message: "Product name must be at least 3 characters long" });
    }
    const category = await Category.findOne({category_name:productData.category_ref});
    if (!category) {
      return res
        .status(400)
        .json({ message: "Category not found" });
    }
    productData.category_ref = category._id
    const subCategory = await SubCategory.findOne({sub_category_name:productData.sub_category_ref});
    if (!subCategory) {
      return res
        .status(400)
        .json({ message: "SubCategory not found" });
    }
    productData.sub_category_ref = subCategory._id
    // create new zone rack
    const zoneRackData = await Promise.all( productData.zoneRack.map(async(zoneRack) => {
      const zoneRackData = await new ZoneRack(zoneRack || {});
      const savedZoneRack = await zoneRackData.save();
      return savedZoneRack._id;
    }
    ));


   productData.zoneRack = zoneRackData;

    // Create a new product
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    res
      .status(201)
      .json({ message: "Product created successfully", data: savedProduct });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .exec();

    res.status(200).json(products); // Send only the products array
  } catch (error) {
    res.status(500).json({ error: error.message }); // Simplified error response
  }
};
// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId)
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product retrieved successfully", data: product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving product", error: error.message });
  }
};

// Update a product by ID
exports.updateProduct = async (req, res) => {
  const productId = req.params.productId;
  const updatedData = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run validation on the updated data
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product updated successfully", data: updatedProduct });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product deleted successfully", data: deletedProduct });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

// Update product stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined) {
      return res.status(400).json({ message: "Stock value is required" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.stock = stock;
    const updatedProduct = await product.save();

    res
      .status(200)
      .json({ message: "Stock updated successfully", data: updatedProduct });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating stock", error: error.message });
  }
};

// Add a review to a product
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({ message: "Review data is required" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.review.push(review);
    const updatedProduct = await product.save();

    res
      .status(200)
      .json({ message: "Review added successfully", data: updatedProduct });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding review", error: error.message });
  }
};

exports.getDrafts = async (req, res) => {
  try {
    const drafts = await Product.find({ draft: "true" });
    res.status(200).json(drafts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const mongoose = require("mongoose");
const Product = require("../models/product_model");
const Category = require("../models/category_model");
const ZoneRack = require("../models/zoneRack_model");
const SubCategory = require("../models/sub_category_model");
const Warehouse = require("../models/warehouse_model");
const Brand = require("../models/brand_model");
// Create a new product
exports.createProduct = async (req, res) => {
  try {
    let productData = req.body;
    console.dir(productData, { depth: null });

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
    const brand = await Brand.findOne({ brand_name: productData.Brand });
    if (!brand) {
      return res.status(400).json({ message: "Brand not found" });
    }
    productData.Brand = brand._id;

    const category = await Category.findOne({
      category_name: productData.category_ref,
    });
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
    productData.category_ref = category._id;

    const subCategoryIds = await Promise.all(productData.sub_category_ref.map(async (sub_category_ref) => {
      console.log("Hello", sub_category_ref);
      const subCategory = await SubCategory.findOne({
        sub_category_name: sub_category_ref,
      });
      if (!subCategory) {
        return res.status(400).json({ message: "SubCategory not found" });
      }
      return subCategory._id
    })
    )
    productData.sub_category_ref = subCategoryIds;

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
    const products = await Product.find({ isDeleted: false, draft: false })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ createdAt: -1 })
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
// Get all products by category ID
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ category_ref: categoryId, isDeleted: false, draft: false })
      .populate(
        "Brand category_ref sub_category_ref variations warehouse_ref  review"
      )
      .exec();

    res
      .status(200)
      .json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving products", error: error.message });
  }
};

// Get all products by subcategory ID
exports.getProductsBySubCategory = async (req, res) => {
  try {
    const subCategoryId = new mongoose.Types.ObjectId(req.params.subCategoryId);
    const products = await Product.find({ sub_category_ref: subCategoryId ,isDeleted: false, draft: false })//, 
      .populate(
        "Brand category_ref sub_category_ref variations warehouse_ref  review"
      )
      .exec();

    res
      .status(200)
      .json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving products", error: error.message });
  }
};
//get multiple subcategory products
exports.getProductsBySubCategories = async (req, res) => {
  try {
    const { subCategoryIds } = req.body; // Expecting an array of subcategory IDs

    if (
      !subCategoryIds ||
      !Array.isArray(subCategoryIds) ||
      subCategoryIds.length === 0
    ) {
      return res.status(400).json({ message: "Invalid subCategoryIds array" });
    }

    const products = await Product.find({
      sub_category_ref: { $in: subCategoryIds },
      isDeleted: false,
      draft: false
    })
      .populate(
        "Brand category_ref sub_category_ref variations warehouse_ref  review"
      )
      .exec();

    res
      .status(200)
      .json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving products", error: error.message });
  }
};

// Update a product by ID
exports.updateProduct = async (req, res) => {
  const productId = req.params.productId;
  const updatedData = req.body;

  try {
    const brand = await Brand.findOne({ brand_name: updatedData.Brand });
    if (!brand) {
      return res.status(400).json({ message: "Brand not found" });
    }
    updatedData.Brand = brand._id;
    const category = await Category.findOne({
      category_name: updatedData.category_ref,
    });
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
    updatedData.category_ref = category._id;
    const subCategory = await SubCategory.findOne({
      sub_category_name: updatedData.sub_category_ref,
    });
    if (!subCategory) {
      return res.status(400).json({ message: "SubCategory not found" });
    }
    updatedData.sub_category_ref = subCategory._id;
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

exports.getLowStockProducts = async (req, res) => {
  try {
    const { warehouse_ref } = req.query; // Get warehouse_ref from the query string

    // If warehouse_ref is provided, filter based on that warehouse
    let filter = {};
    let populateQuery = [];

    if (warehouse_ref) {
      filter = {
        "variations.stock": {
          $elemMatch: {
            warehouse_ref: new mongoose.Types.ObjectId(warehouse_ref), // Match the warehouse reference
            stock_qty: { $lt: 10 }, // Check if stock quantity is less than 10
          },
        },
      };

      populateQuery = [
        {
          path: "variations.stock.warehouse_ref", // Populate warehouse reference
          model: "Warehouse", // The model to populate (should match your Warehouse model)
        },
      ];
    } else {
      filter = {
        "variations.stock.stock_qty": { $lt: 10 }, // No warehouse filter, just quantity < 10
      };

      populateQuery = [
        {
          path: "variations.stock.warehouse_ref", // Populate warehouse reference
          model: "Warehouse", // The model to populate (should match your Warehouse model)
        },
      ];
    }

    // Query products with the filter and populate warehouse_ref
    const products = await Product.find(filter).populate(populateQuery);

    // If no products are found, return a 404 error
    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No low stock products found" });
    }

    // Return the result
    return res.status(200).json({ data: products });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return res.status(500).json({
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};

exports.getProductsbyPincode = async (req, res) => {
  try {
    const { pincode } = req.body;
    const warehouse = await Warehouse.findOne({ picode: pincode });
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found for this variant" });
    }

    const products = await Product.find({ warehouse_ref: warehouse._id })
      .populate("Brand category_ref sub_category_ref variations")
      .exec();

    res.status(200).json({ message: "Products retrieved successfully", data: products, warehouse: warehouse });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving products", error: error.message });

  }
};

exports.getProductByBrand = async (req, res) => {
  try {
    const { brandId } = req.body;
    const products = await Product.find({ Brand: brandId, isDeleted: false, draft: false }).populate("Brand category_ref sub_category_ref").exec();
    res.status(200).json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};

exports.updateVariation = async (req, res) => {
  try {

    const { productId, variation_id, variationData } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    let varFound = false;
    const updatedVariations = product.variations.map((variation) => {
      if (variation._id.toString() === variation_id) {
        varFound = true;
        return { ...variation.toObject(), ...variationData };
      }
      return variation;
    });

    product.variations = updatedVariations;

    await product.save();

    if (!varFound) {
      return res.status(404).json({ message: "Variation not found" });
    }

    res.status(200).json({ message: "Variation updated successfully", data: product });
  } catch (error) {
    res.status(500).json({ message: "Error updating variation", error: error.message });
  }
};

exports.softDeleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.isDeleted = true;
    await product.save();
    res.status(200).json({ message: "Product deleted successfully", data: product });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};
exports.softDeleteVariation = async (req, res) => {
  try {
    const { productId, variationId, stock_id } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const updatedVariations = product.variations.map((variation) => {
      if (variation._id.toString() === variationId) {
        variation.stock = variation.stock.map((item) => {
          if (item._id.toString() === stock_id) {
            item.isDeleted = true;
          }
          return item;
        })

      }
      return variation;
    });

    product.variations = updatedVariations;

    await product.save();

    res.status(200).json({ message: "Variation deleted successfully", data: product });
  } catch (error) {
    console.error("Error deleting variation:", error);
    res.status(500).json({ message: "Error deleting variation", error: error.message });
  }
};



exports.getAllProductsByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const products = await Product.find({ warehouse_ref: warehouseId, isDeleted: false, draft: false }).populate("Brand category_ref sub_category_ref").exec();
    res.status(200).json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};

exports.getDraftsByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const products = await Product.find({ warehouse_ref: warehouseId, draft: "true" }).populate("Brand category_ref sub_category_ref").exec();
    res.status(200).json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};
exports.getProductsByWarehuseCategorySubCategory = async (req, res) => {
  try {
    const { warehouseId, categoryName, subCategoryName, warehouseName } = req.params;
    let warehouse;
    if (warehouseId) {
      warehouse = await Warehouse.find({ _id: warehouseId });

    } else if (warehouseName) {
      warehouse = await Warehouse.find({ warehouse_name: warehouseName });
    }
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const category = await Category.findOne({ category_name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const subCategory = await SubCategory.findOne({ sub_category_name: subCategoryName, category_ref: category._id });
    if (!subCategory) {
      return res.status(404).json({ message: "Sub-category not found" });
    }
    const categoryId = category._id;
    const subCategoryId = subCategory._id;

    const products = await Product.find({ warehouse_ref: warehouse[0]._id, category_ref: categoryId, sub_category_ref: subCategoryId }).populate("Brand category_ref sub_category_ref").exec();
    res.status(200).json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};

exports.searchProducts = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    // Case-insensitive search for products whose names start with the provided term
    const products = await Product.find({
      product_name: { $regex: `^${name}`, $options: "i" },
      isDeleted: false
    });

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found", data: products });
    }

    return res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.searchProductsByWarehouse = async (req, res) => {
  const { name } = req.query;
  const { warehouseId } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    // Case-insensitive search for products whose names start with the provided term
    const products = await Product.find({
      product_name: { $regex: `^${name}`, $options: "i" },
      warehouse_ref: warehouseId,
      isDeleted: false
    });

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found", data: products });
    }

    return res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
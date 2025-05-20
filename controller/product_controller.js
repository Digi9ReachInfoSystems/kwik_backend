const mongoose = require("mongoose");
const Product = require("../models/product_model");
const Category = require("../models/category_model");
const ZoneRack = require("../models/zoneRack_model");
const SubCategory = require("../models/sub_category_model");
const Warehouse = require("../models/warehouse_model");
const Brand = require("../models/brand_model");
const User = require("../models/user_models");
const Order = require("../models/order_model");
const SearchHistory = require("../models/searchHistory_model");

const getRandomProducts = (products, limit) => {
  const shuffled = products.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
};
const getRandomCategories = (categories, limit) => {
  const shuffled = categories.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
};
const getUniqueProducts = (products) => {
  const seenIds = new Set();
  return products.filter(product => {
    if (!seenIds.has(product._id.toString())) {
      seenIds.add(product._id.toString());
      return true;
    }
    return false;
  });
};
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
    if (productData.variations) {
      productData.variations = productData.variations.map((variation) => {
        const { _id, ...variationWithoutId } = variation; // Deconstruct and remove _id
        return variationWithoutId;
      });
    }
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
    const products = await Product.find({ isDeleted: false, draft: false, qc_status: "approved" })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
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
    const products = await Product.find({ category_ref: categoryId, isDeleted: false, draft: false, qc_status: "approved" })
      .populate(
        "Brand category_ref sub_category_ref variations warehouse_ref  review"
      )
      .sort({ created_time: -1 })
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
    const products = await Product.find({ sub_category_ref: subCategoryId, isDeleted: false, draft: false, qc_status: "approved" })//, 
      .populate(
        "Brand category_ref sub_category_ref variations warehouse_ref  review"
      )
      .populate({
        path: "sub_category_ref",
        populate: {
          path: "category_ref",
        }
      })
      .sort({ created_time: -1 })
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
      draft: false,
      qc_status: "approved"
    })
      .populate(
        "Brand category_ref  variations warehouse_ref  sub_category_ref"
      )
      .populate({
        path: "sub_category_ref",
        populate: {
          path: "category_ref",
        }
      })
      .sort({ created_time: -1 })
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
  const updatedData = req.body.updatedData;
  const isQcRequired = req.body.isQcRequired;
  console.dir(req.body, { depth: null });

  if (isQcRequired === true) {
    updatedData.qc_status = "revised";
  }
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
    const subcategory = await Promise.all(updatedData.sub_category_ref.map(async (sub) => {
      const result = await SubCategory.findOne({
        sub_category_name: sub,
      });
      return result._id;
    }))
    updatedData.sub_category_ref = subcategory;
    updatedData.variations = updatedData.variations.map((variation) => {
      if (mongoose.Types.ObjectId.isValid(variation._id)) {
        return {
          ...variation,
          _id: variation._id,
        };
      } else {
        return {
          ...variation,
          _id: new mongoose.Types.ObjectId(),
        };
      }
    });
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
    const { productId } = req.params;
    const { stock, variationId, warehouseId } = req.body;

    if (stock === undefined) {
      return res.status(400).json({ message: "Stock value is required" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (stock > 0) {


      product.variations.find((variation) => variation._id == variationId).stock.find((item) => item.warehouse_ref == warehouseId).stock_qty = stock;
      product.variations.find((variation) => variation._id == variationId).stock.find((item) => item.warehouse_ref == warehouseId).visibility = true;
      // const updatedProduct = await product.save();
    } else {

      product.variations.find((variation) => variation._id == variationId).stock.find((item) => item.warehouse_ref == warehouseId).stock_qty = 0;
      product.variations.find((variation) => variation._id == variationId).stock.find((item) => item.warehouse_ref == warehouseId).visibility = false;
    }
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.params;
    const { user_ref, comment, rating } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const user = await User.findOne({ UID: user_ref })
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 0 and 5" });
    }
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const existingReviewIndex = product.review.findIndex(
      (review) => review.user_ref.equals(user._id)
    );

    if (existingReviewIndex !== -1) {
      // Update existing review
      product.review[existingReviewIndex].comment = comment;
      product.review[existingReviewIndex].rating = rating;
      product.review[existingReviewIndex].created_time = new Date();

      await product.save({ session });
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({
        message: "Review updated successfully",
        review: product.review[existingReviewIndex],
      });
    } else {
      const newReview = {
        user_ref: user._id,
        comment,
        rating,
        created_time: new Date(),
      };

      product.review.push(newReview);
      await product.save({ session });
      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        message: "Review added successfully",
        review: newReview,
      });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(500)
      .json({ message: "Error adding review", error: error.message });
  }
};

exports.getDrafts = async (req, res) => {
  try {
    const drafts = await Product.find({
      isDeleted: false,
      draft: true,
      qc_status: "approved"
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 });
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
        isDeleted: false,
        draft: false,
        qc_status: "approved",
      };

      // populateQuery = [
      //   {
      //     path: "variations.stock.warehouse_ref", // Populate warehouse reference
      //     model: "Warehouse", // The model to populate (should match your Warehouse model)
      //   },
      // ];
    } else {
      filter = {
        "variations.stock.stock_qty": { $lt: 10 }, // No warehouse filter, just quantity < 10
        isDeleted: false,
        draft: false,
        qc_status: "approved",
      };

      // populateQuery = [
      //   {
      //     path: "variations.stock.warehouse_ref", // Populate warehouse reference
      //     model: "Warehouse", // The model to populate (should match your Warehouse model)
      //   },
      // ];
    }

    // Query products with the filter and populate warehouse_ref
    const products = await Product.find(filter).populate(populateQuery)
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 });

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

    const products = await Product.find({ warehouse_ref: warehouse._id, isDeleted: false, draft: false, qc_status: "approved" })
      .populate("Brand category_ref sub_category_ref variations")
      .sort({ created_time: -1 })
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
    const brandId = new mongoose.Types.ObjectId(req.params.brandId);
    const products = await Product.find({ Brand: brandId, isDeleted: false, draft: false, qc_status: "approved" }).populate("Brand category_ref sub_category_ref")
      .populate({
        path: "sub_category_ref",
        populate: { path: "category_ref" }
      })
      .sort({ created_time: -1 })
      .exec();
    res.status(200).json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};

exports.updateVariation = async (req, res) => {
  try {

    const { productId, variation_id, variationData, isQcRequired } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (isQcRequired) {
      product.qc_status = "revised";
    }
    let varFound = false;
    const updatedVariations = product.variations.map((variation) => {
      if (variation._id.toString() === variation_id) {
        varFound = true;
        return {
          ...variation.toObject(),
          ...variationData,
          _id: variation._id,  // Ensure _id is not overwritten
        };
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
    const products = await Product.find({ warehouse_ref: warehouseId, isDeleted: false, draft: false, qc_status: "approved" }).populate("Brand category_ref sub_category_ref")
      .sort({ created_time: -1 })
      .exec();
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
    const products = await Product.find({ warehouse_ref: warehouseId, draft: "true" }).populate("Brand category_ref sub_category_ref")
      .sort({ created_time: -1 })
      .exec();
    res.status(200).json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};
exports.getProductsByWarehuseCategorySubCategory = async (req, res) => {
  try {
    const { warehouseId, categoryName, warehouseName, subCategoryName } = req.params;
    const filter = {}
    let warehouse;
    if (warehouseId) {
      warehouse = await Warehouse.find({ _id: warehouseId });

    } else if (warehouseName) {
      warehouse = await Warehouse.find({ warehouse_name: warehouseName });
    }
    filter.warehouse_ref = warehouse[0]._id;
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    const category = await Category.findOne({ category_name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    filter.category_ref = category._id;
    let subCategory;
    if (subCategoryName != "null") {
      subCategory = await SubCategory.findOne({ sub_category_name: subCategoryName, category_ref: category._id });
      if (!subCategory) {
        return res.status(404).json({ message: "Sub-category not found" });
      }
      filter.sub_category_ref = subCategory._id;
    }
    filter.isDeleted = false;
    filter.draft = false;
    filter.qc_status = "approved";

    const products = await Product.find(filter).populate("Brand category_ref sub_category_ref")
      .sort({ created_time: -1 })
      .exec();
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
      product_name: { $regex: `${name}`, $options: "i" },
      isDeleted: false,
      draft: false,
      qc_status: "approved"
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();

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
      product_name: { $regex: `${name}`, $options: "i" },
      warehouse_ref: warehouseId,
      isDeleted: false,
      draft: false,
      qc_status: "approved"
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found", data: products });
    }

    return res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.updateQcStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { product_qc_status, UID, qc_remarks } = req.body;
    if (!UID || !productId || !product_qc_status) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const user = await User.findOne({ UID: UID });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    product.qc_status = product_qc_status;
    product.last_qc_done_by = user._id;
    product.qc_remarks = qc_remarks;
    product.qc_date = Date.now();
    const updatedProduct = await product.save();
    return res.status(200).json({ message: "Product updated successfully", data: updatedProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}
exports.getProductsByQcStatus = async (req, res) => {
  try {
    const { qc_status, warehouseId } = req.query;
    const filter = {};
    if (!qc_status) {
      return res.status(400).json({ message: "Missing required fields qc_status" });
    }
    filter.qc_status = qc_status;
    if (warehouseId) {
      filter.warehouse_ref = warehouseId;
    }
    const products = await Product.find(filter).populate("Brand category_ref sub_category_ref").exec();
    res.status(200).json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};

exports.getDraftProductsByWarehuseCategorySubCategory = async (req, res) => {
  try {
    const { warehouseId, categoryName, warehouseName, subCategoryName } = req.params;
    const filter = {};
    let warehouse;
    if (warehouseId) {
      warehouse = await Warehouse.find({ _id: warehouseId });

    } else if (warehouseName) {
      warehouse = await Warehouse.find({ warehouse_name: warehouseName });
    }
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    filter.warehouse_ref = warehouse[0]._id;
    const category = await Category.findOne({ category_name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    filter.category_ref = category._id;
    let subCategory;
    if (subCategoryName != "null") {
      subCategory = await SubCategory.findOne({ sub_category_name: subCategoryName, category_ref: category._id });
      if (!subCategory) {
        return res.status(404).json({ message: "Sub-category not found" });
      }
      filter.sub_category_ref = subCategory._id;
    }
    filter.isDeleted = false;
    filter.draft = true;
    filter.qc_status = "approved"


    // const products = await Product.find({ warehouse_ref: warehouse[0]._id, category_ref: categoryId, sub_category_ref: subCategoryId, isDeleted: false, draft: true, qc_status: "approved" }).populate("Brand category_ref sub_category_ref warehouse_ref")
    const products = await Product.find(filter).populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();
    res.status(200).json({ message: "Draft Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};

exports.getLowStockProductsByWarehuseCategorySubCategory = async (req, res) => {
  try {
    const { warehouseId, categoryName, warehouseName, subCategoryName } = req.params;
    const filter = {};
    let warehouse;
    if (warehouseId) {
      warehouse = await Warehouse.find({ _id: warehouseId });

    } else if (warehouseName) {
      warehouse = await Warehouse.find({ warehouse_name: warehouseName });
    }
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    filter.warehouse_ref = warehouse[0]._id;
    const category = await Category.findOne({ category_name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    filter.category_ref = category._id;
    let subCategory;
    if (subCategoryName != "null") {
      subCategory = await SubCategory.findOne({ sub_category_name: subCategoryName, category_ref: category._id });
      if (!subCategory) {
        return res.status(404).json({ message: "Sub-category not found" });
      }
      filter.sub_category_ref = subCategory._id;
    }
    filter.isDeleted = false;
    filter.draft = false;
    filter.qc_status = "approved"
    const products = await Product.find({ ...filter, "variations.stock.stock_qty": { $lt: 10 } }).populate("Brand category_ref sub_category_ref")
      .sort({ created_time: -1 })
      .exec();
    res.status(200).json({ message: "Low Stock Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};
exports.getProductNotInWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const filter = {};
    if (!warehouseId) {
      res.status(400).json({ message: "Missing required fields warehouseId" });
    }
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    filter.warehouse_ref = { $ne: warehouseId };
    filter.isDeleted = false;
    filter.draft = false;
    filter.qc_status = "approved"
    const products = await Product.find({ ...filter }).populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();
    res.status(200).json({ message: "Low Stock Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};

exports.addStockToExistingProduct = async (req, res) => {
  try {
    const { productId, warehouse_ref, stock_qty, unit, zone, rack } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // product.warehouse_ref.push(warehouse_ref);
    if (!product.warehouse_ref.some(w => w.toString() === warehouse_ref.toString())) {
      product.warehouse_ref.push(warehouse_ref);
    }
    product.variations.map((variation) => {
      if (variation.unit === unit) {
        const newStock = {
          stock_qty: stock_qty,
          warehouse_ref: warehouse_ref,
          unit: unit,
          zone: zone,
          rack: rack,
          visibility: true,
          isDeleted: false
        };
        variation.stock.push(newStock);
      }
    });
    await product.save();
    res.status(200).json({ message: "Stock added to product successfully", data: product });
  } catch (error) {
    res.status(500).json({ message: "Error adding stock to product", error: error.message });
  }
};
exports.getRecomandedProducts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { categoryId } = req.query;
    const user = await User.findOne({ UID: userId })
      .populate('cart_products.product_ref')
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const warehouse = await Warehouse.findOne({ picode: user.current_pincode }).exec();
    const orders = await Order.find({ user_ref: user._id }).populate('products.product_ref').exec();

    let recommendedProducts = [];
    if (orders.length > 0) {
      const orderedCategories = orders.flatMap(order =>
        order.products.map(product => product.product_ref.category_ref)
      );
      const uniqueCategories = [...new Set(orderedCategories.map(cat => cat.toString()))];
      // const randomCategories = getRandomCategories(uniqueCategories, 4);

      for (const category of uniqueCategories) {
        let productsInCategory = await Product.aggregate([
          {
            $match: {
              category_ref: new mongoose.Types.ObjectId(category),
              warehouse_ref: warehouse._id,
              isDeleted: false,
              qc_status: "approved",
              draft: false
            }
          },
          { $sample: { size: 10 } }
        ]).exec();
        productsInCategory = await Product.populate(productsInCategory, [
          { path: "Brand" },
          { path: "category_ref" },
          { path: "sub_category_ref" },
          { path: "variations" },
          { path: "warehouse_ref" },
          { path: "review" },
          // If you need nested populate:
          {
            path: "sub_category_ref",
            populate: { path: "category_ref" }
          }
        ]);
        recommendedProducts = [...recommendedProducts, ...getRandomProducts(productsInCategory, 5)];
        // if (recommendedProducts.length >= 10) break;
      }
      // if (recommendedProducts.length >= 10) {
      //   return res.status(200).json({ message: "Recomanded products retrieved successfully", data: getUniqueProducts(recommendedProducts).slice(0, 10) });
      // }
    }
    if (user.cart_products.length > 0) {
      const cartCategories = user.cart_products.map(cartProduct => cartProduct.product_ref.category_ref);
      const uniqueCartCategories = [...new Set(cartCategories.map(cat => cat.toString()))];
      // const randomCategoriesFromCart = getRandomCategories(uniqueCartCategories, 3); // Adjust number of categories as needed

      for (const category of uniqueCartCategories) {
        let productsInCartCategory = await Product.aggregate([
          {
            $match: {
              category_ref: new mongoose.Types.ObjectId(category),
              warehouse_ref: warehouse._id,
              isDeleted: false,
              qc_status: "approved",
              draft: false
            }
          },
          { $sample: { size: 10 } }
        ]).exec();
        productsInCartCategory = await Product.populate(productsInCartCategory, [
          { path: "Brand" },
          { path: "category_ref" },
          { path: "sub_category_ref" },
          { path: "variations" },
          { path: "warehouse_ref" },
          { path: "review" },
          // If you need nested populate:
          {
            path: "sub_category_ref",
            populate: { path: "category_ref" }
          }
        ]);
        recommendedProducts = [...recommendedProducts, ...getRandomProducts(productsInCartCategory, 5)];
        // if (recommendedProducts.length >= 10) break;
      }

      // if (recommendedProducts.length >= 10) {
      //   return res.status(200).json({ message: "Recomanded products retrieved successfully", data: getUniqueProducts(recommendedProducts).slice(0, 10) });
      // }
    }
    if (user.current_pincode) {
      let topSellingProducts = await Order.aggregate([
        { $match: { warehouse_ref: warehouse._id } },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product_ref",
            totalQuantitySold: { $sum: "$products.quantity" }
          }
        },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: 10 }, // Limit to top 10 products
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        { $unwind: "$productDetails" },
        {
          $match: {
            "productDetails.isDeleted": false,
            "productDetails.qc_status": "approved",
            "productDetails.draft": false
          }
        },
        {
          $lookup: {
            from: "brands",
            localField: "productDetails.Brand",
            foreignField: "_id",
            as: "productDetails.Brand"
          }
        },
        { $unwind: "$productDetails.Brand" },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.category_ref",
            foreignField: "_id",
            as: "productDetails.category_ref"
          }
        },
        { $unwind: "$productDetails.category_ref" },
        {
          $lookup: {
            from: "subcategories",
            localField: "productDetails.sub_category_ref", // array of ObjectIds
            foreignField: "_id",
            as: "productDetails.sub_category_ref"
          }
        },
        { $unwind: "$productDetails.sub_category_ref" },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.sub_category_ref.category_ref",
            foreignField: "_id",
            as: "productDetails.sub_category_ref.category_ref"
          }
        },
        { $unwind: "$productDetails.sub_category_ref.category_ref" },

      ]).exec();
      topSellingProducts = await Product.populate(topSellingProducts, [
        { path: "Brand" },
        { path: "category_ref" },
        { path: "sub_category_ref" },
        { path: "variations" },
        { path: "warehouse_ref" },
        { path: "review" },
        // If you need nested populate:
        {
          path: "sub_category_ref",
          populate: { path: "category_ref" }
        }
      ]);

      recommendedProducts = [...recommendedProducts, ...topSellingProducts.map(item => item.productDetails)];


      // recommendedProducts = getUniqueProducts(recommendedProducts).slice(0, 10);
    }


    let defaultCategory = null;
    if (categoryId != "null") {
      defaultCategory = await Category.findById(categoryId);
    }
    if (defaultCategory != null) {
      let productsInDefaultCategory = await Product.aggregate([
        {
          $match: {
            category_ref: defaultCategory._id,
            warehouse_ref: warehouse._id,
            isDeleted: false,
            qc_status: "approved",
            draft: false
          }
        },
        { $sample: { size: 20 } }
      ]).exec();
      productsInDefaultCategory = await Product.populate(productsInDefaultCategory, [
        { path: "Brand" },
        { path: "category_ref" },
        { path: "sub_category_ref" },
        { path: "variations" },
        { path: "warehouse_ref" },
        { path: "review" },
        {
          path: "sub_category_ref",
          populate: { path: "category_ref" }
        }
      ]);
      recommendedProducts = [...recommendedProducts, ...getRandomProducts(productsInDefaultCategory, 10)];
      //if (recommendedProducts.length >= 10) return 
      // res.status(200).json({ message: "Recomanded products retrieved successfully", data: getUniqueProducts(recommendedProducts).slice(0, 10) });
    }


    return res.status(200).json({ message: "Recomanded products retrieved successfully", randomTenProducts: getUniqueProducts(recommendedProducts).slice(0, 10), allProducts: getUniqueProducts(recommendedProducts) });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving recomanded products", error: error.message });
  }
};

exports.searchLowStockProducts = async (req, res) => {
  try {
    const { name } = req.query;
    const { warehouseId } = req.params;

    // If warehouse_ref is provided, filter based on that warehouse
    let filter = {};
    let populateQuery = [];

    if (warehouseId) {
      filter = {
        product_name: { $regex: `${name}`, $options: "i" },
        "variations.stock": {
          $elemMatch: {
            warehouse_ref: new mongoose.Types.ObjectId(warehouseId), // Match the warehouse reference
            stock_qty: { $lt: 10 }, // Check if stock quantity is less than 10
          },
        },
        isDeleted: false,
        draft: false,
        qc_status: "approved",
      };

      // populateQuery = [
      //   {
      //     path: "variations.stock.warehouse_ref", // Populate warehouse reference
      //     model: "Warehouse", // The model to populate (should match your Warehouse model)
      //   },
      // ];
    } else {
      filter = {
        product_name: { $regex: `^${name}`, $options: "i" },
        "variations.stock.stock_qty": { $lt: 10 }, // No warehouse filter, just quantity < 10
        isDeleted: false,
        draft: false,
        qc_status: "approved",
      };

      populateQuery = [
        {
          path: "variations.stock.warehouse_ref", // Populate warehouse reference
          model: "Warehouse", // The model to populate (should match your Warehouse model)
        },
      ];
    }

    // Query products with the filter and populate warehouse_ref
    const products = await Product.find(filter).populate(populateQuery)
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 });

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

exports.searchDrafts = async (req, res) => {
  try {
    const { name } = req.query;
    const { warehouseId } = req.params;
    const drafts = await Product.find({
      product_name: { $regex: `${name}`, $options: "i" },
      warehouse_ref: warehouseId,
      isDeleted: false,
      draft: true,
      qc_status: "approved"
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 });
    res.status(200).json({ success: true, message: "Drafts retrieved successfully", data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching draft products", error: error.message });
  }
};
exports.getRecomandedProductsBasedOnOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ UID: userId })
      .populate('cart_products.product_ref')
      .exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const warehouse = await Warehouse.findOne({ picode: user.current_pincode }).exec();
    const orders = await Order.find({ user_ref: user._id }).populate('products.product_ref').exec();
    const cartProducts = user.cart_products;
    let recommendedProducts = [];
    if (orders.length > 0) {
      const orderedCategories = orders.flatMap(order =>
        order.products.map(product => product.product_ref.category_ref)
      );
      const uniqueCategories = [...new Set(orderedCategories.map(cat => cat.toString()))];

      for (const category of uniqueCategories) {
        let productsInCategory = await Product.aggregate([
          {
            $match: {
              category_ref: new mongoose.Types.ObjectId(category),
              warehouse_ref: warehouse._id,
              isDeleted: false,
              qc_status: "approved",
              draft: false
            }
          },
          { $sample: { size: 10 } }
        ])
          .exec();
        productsInCategory = await Product.populate(productsInCategory, [
          { path: "Brand" },
          { path: "category_ref" },
          { path: "sub_category_ref" },
          { path: "variations" },
          { path: "warehouse_ref" },
          { path: "review" },
          // If you need nested populate:
          {
            path: "sub_category_ref",
            populate: { path: "category_ref" }
          }
        ]);
        recommendedProducts = [...recommendedProducts, ...getRandomProducts(productsInCategory, 6)];
      }

    }
    if (user.current_pincode) {
      let topSellingProducts = await Order.aggregate([
        { $match: { warehouse_ref: warehouse._id } },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.product_ref",
            totalQuantitySold: { $sum: "$products.quantity" }
          }
        },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails"
          }
        },
        { $unwind: "$productDetails" },
        {
          $match: {
            "productDetails.isDeleted": false,
            "productDetails.qc_status": "approved",
            "productDetails.draft": false
          }
        },
        {
          $lookup: {
            from: "brands",
            localField: "productDetails.Brand",
            foreignField: "_id",
            as: "productDetails.Brand"
          }
        },
        { $unwind: "$productDetails.Brand" },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.category_ref",
            foreignField: "_id",
            as: "productDetails.category_ref"
          }
        },
        { $unwind: "$productDetails.category_ref" },
        {
          $lookup: {
            from: "subcategories",
            localField: "productDetails.sub_category_ref", // array of ObjectIds
            foreignField: "_id",
            as: "productDetails.sub_category_ref"
          }
        },
        { $unwind: "$productDetails.sub_category_ref" },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.sub_category_ref.category_ref",
            foreignField: "_id",
            as: "productDetails.sub_category_ref.category_ref"
          }
        },
        { $unwind: "$productDetails.sub_category_ref.category_ref" },
      ]).exec();
      topSellingProducts = await Product.populate(topSellingProducts, [
        { path: "Brand" },
        { path: "category_ref" },
        { path: "sub_category_ref" },
        { path: "variations" },
        { path: "warehouse_ref" },
        { path: "review" },
        // If you need nested populate:
        {
          path: "sub_category_ref",
          populate: { path: "category_ref" }
        }
      ]);
      topSellingProducts = await Product.populate(topSellingProducts, [
        {
          path: "sub_category_ref", // nested path
          model: "SubCategory",                   // explicitly define model
          populate: {
            path: "category_ref",                 // if SubCategory has category_ref
            model: "Category"
          }
        },
      ]);
      recommendedProducts = [...recommendedProducts, ...topSellingProducts.map(item => item.productDetails)];
      if (topSellingProducts.length < 20) {
        const productsInWarehouse = await Product.aggregate([
          { $match: { warehouse_ref: warehouse._id } },
        ])
          .exec();
        const categoriesInWarehouse = [...new Set(productsInWarehouse.map(product => product.category_ref))];
        const uniqueCategoriesInWarehouse = [...new Set(categoriesInWarehouse.map(cat => cat.toString()))];
        for (const category of uniqueCategoriesInWarehouse) {
          let productsInWarehouseCategory = await Product.aggregate([
            {
              $match: {
                category_ref: new mongoose.Types.ObjectId(category),
                warehouse_ref: warehouse._id,
                isDeleted: false,
                qc_status: "approved",
                draft: false
              }
            },
            { $sample: { size: 10 } }
          ])
            .exec();
          productsInWarehouseCategory = await Product.populate(productsInWarehouseCategory, [
            { path: "Brand" },
            { path: "category_ref" },
            { path: "sub_category_ref" },
            { path: "variations" },
            { path: "warehouse_ref" },
            { path: "review" },
            // If you need nested populate:
            {
              path: "sub_category_ref",
              populate: { path: "category_ref" }
            }
          ]);
          recommendedProducts = [...recommendedProducts, ...getRandomProducts(productsInWarehouseCategory, 3)];

        }
      }
    }
    return res.status(200).json({ message: "Recomanded products retrieved successfully", allProducts: getUniqueProducts(recommendedProducts), user: user, searchHistory: user.search_history });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving recomanded products", error: error.message });
  }

}

exports.searchProductsbyUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { query,saveHistory=false } = req.query;
    const user = await User.findOne({ UID: userId }).exec();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const warehouse = await Warehouse.findOne({ picode: user.current_pincode }).exec();
    const products = await Product.find({
      product_name: { $regex: `${query}`, $options: "i" },
      warehouse_ref: warehouse._id,
      isDeleted: false,
      qc_status: "approved",
      draft: false
    })
      .limit(20)
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .populate({
        path: "sub_category_ref",
        populate: { path: "category_ref" }
      })
      .sort({ created_time: -1 });

    const searchHistory = {
      query: query,
      timestamp: new Date()
    };

    const existingQuery = user.search_history.find(item => item.query === query);

    if (!existingQuery) {
      user.search_history.push(searchHistory);
    }
    await user.save();
    res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching products", error: error.message });
  }
};
exports.deleteProductWarehouse = async (req, res) => {
  try {
    const { productId, warehouseId, variationId } = req.body;
    const product = await Product.findById(productId).exec();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const variantIndex = product.variations.findIndex(variant => variant._id.toString() === variationId);
    if (variantIndex === -1) {
      return res.status(404).json({ message: "Variant not found" });
    }
    const stockIndex = product.variations[variantIndex].stock.findIndex(item => item.warehouse_ref.toString() === warehouseId);
    product.variations[variantIndex].stock[stockIndex].isDeleted = true;
    const allVariantsDeleted = product.variations.every(variant =>
      variant.stock.every(stock => stock.warehouse_ref.toString() !== warehouseId || stock.isDeleted === true)
    );
    if (allVariantsDeleted) {
      const warehouseIndex = product.warehouse_ref.indexOf(warehouseId);
      if (warehouseIndex !== -1) {
        product.warehouse_ref.splice(warehouseIndex, 1); // Removes the warehouseId from warehouse_ref
      }
    }
    await product.save();
    res.status(200).json({ message: "Product warehouse deleted successfully", data: product });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product warehouse", error: error.message });
  }
};
exports.searchProductSkuName = async (req, res) => {
  try {
    const { warehouseId } = req.params
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }
    let products = await Product.find({
      sku: { $regex: `${query}`, $options: "i" },
      warehouse_ref: warehouseId,
      isDeleted: false,
      qc_status: "approved",
      draft: false
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .populate({
        path: "sub_category_ref",
        populate: { path: "category_ref" }
      })
      .sort({ created_time: -1 });
    if (products.length == 0) {

      products = await Product.find({
        product_name: { $regex: `${query}`, $options: "i" },
        isDeleted: false,
        qc_status: "approved",
        draft: false
      })
        .populate("Brand category_ref sub_category_ref warehouse_ref")
        .populate({
          path: "sub_category_ref",
          populate: { path: "category_ref" }
        })
        .sort({ created_time: -1 });
    }

    res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching products", error: error.message });
  }
};

exports.qcStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;

    let approvedCount, rejectedCount, pendingCount, totalCount;
    if (warehouseId != 'null') {
      approvedCount = await Product.countDocuments({ warehouse_ref: warehouseId, qc_status: "approved", warehouse_ref: warehouseId, draft: false, isDeleted: false });
      rejectedCount = await Product.countDocuments({ warehouse_ref: warehouseId, qc_status: "rejected", warehouse_ref: warehouseId, draft: false, isDeleted: false });
      pendingCount = await Product.countDocuments({ warehouse_ref: warehouseId, qc_status: "pending", warehouse_ref: warehouseId, draft: false, isDeleted: false });
      revisedCount = await Product.countDocuments({ warehouse_ref: warehouseId, qc_status: "revised", warehouse_ref: warehouseId, draft: false, isDeleted: false });
      totalCount = await Product.countDocuments({ warehouse_ref: warehouseId, draft: false, isDeleted: false });
    } else {
      approvedCount = await Product.countDocuments({ qc_status: "approved", draft: false, isDeleted: false });
      rejectedCount = await Product.countDocuments({ qc_status: "rejected", draft: false, isDeleted: false });
      pendingCount = await Product.countDocuments({ qc_status: "pending", draft: false, isDeleted: false });
      revisedCount = await Product.countDocuments({ qc_status: "revised", draft: false, isDeleted: false });
      totalCount = await Product.countDocuments({ draft: false, isDeleted: false });
    }

    res.status(200).json({ success: true, message: "QC stats retrieved successfully", data: { approvedCount, rejectedCount, pendingCount, revisedCount, totalCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching QC stats", error: error.message });
  }
};
exports.qcgraph = async (req, res) => {
  try {
    function getDayName(index) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return dayNames[index] || "";
    }
    let product_count = await Product.countDocuments({ draft: false, isDeleted: false });
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to midnight
    const last7DaysArray = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      last7DaysArray.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        dateString: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
        dayName: getDayName(d.getDay()) // e.g. Monday, Tuesday, etc.
      });
    }

    // 2) Calculate 7 days ago for aggregator
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    // The aggregator will match any qc_date >= (7 days ago at midnight)

    // 3) Run the aggregator to group by year-month-day
    const pipeline = [
      {
        $match: {
          qc_date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$qc_date" },
            month: { $month: "$qc_date" },
            day: { $dayOfMonth: "$qc_date" }
          },
          approvedCount: {
            $sum: {
              $cond: [
                { $eq: ["$qc_status", "approved"] },
                1,
                0
              ]
            }
          },
          rejectedCount: {
            $sum: {
              $cond: [
                { $eq: ["$qc_status", "rejected"] },
                1,
                0
              ]
            }
          }
        }
      },
      // Sort by ascending date
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      }
    ];

    const aggResults = await Product.aggregate(pipeline);
    // aggResults is an array like:
    // [
    //   { _id: { year: 2023, month: 9, day: 14 }, approvedCount: 5, rejectedCount: 2 },
    //   { _id: { year: 2023, month: 9, day: 15 }, approvedCount: 7, rejectedCount: 1 },
    //   ...
    // ]

    // 4) Merge aggregator results with the last7DaysArray
    //    For each date in last7DaysArray, find the aggregator item (if any)
    //    Set counts or default to zero
    const finalData = last7DaysArray.map(dayObj => {
      // see if aggregator has an entry for this day
      const foundAgg = aggResults.find(item =>
        item._id.year === dayObj.year &&
        item._id.month === dayObj.month &&
        item._id.day === dayObj.day
      );
      return {
        date: dayObj.dateString,
        dayName: dayObj.dayName,
        approvedCount: foundAgg ? foundAgg.approvedCount : 0,
        rejectedCount: foundAgg ? foundAgg.rejectedCount : 0
      };
    });

    // 5) Return final results
    return res.status(200).json({
      success: true,
      message: "QC status counts for the last 7 days retrieved successfully",
      data: { weeklyData: finalData, product_count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching QC stats", error: error.message });
  }
};
exports.searchQcProductsByWarehouseStatus = async (req, res) => {
  const { name } = req.query;
  const { warehouseId, status } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }
  if (!warehouseId) {
    return res.status(400).json({ message: "warehouseId is required" });
  }

  try {
    // Case-insensitive search for products whose names start with the provided term
    const products = await Product.find({
      product_name: { $regex: `${name}`, $options: "i" },
      warehouse_ref: warehouseId,
      isDeleted: false,
      draft: false,
      qc_status: status
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found", data: products });
    }

    return res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.searchDraftProducts = async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }

  try {
    // Case-insensitive search for products whose names start with the provided term
    const products = await Product.find({
      product_name: { $regex: `${name}`, $options: "i" },
      isDeleted: false,
      draft: true,
      qc_status: "approved"
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found", data: products });
    }

    return res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.searchLowStockProducts = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Search term is required" });
    }

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
        isDeleted: false,
        draft: false,
        qc_status: "approved",
      };

      // populateQuery = [
      //   {
      //     path: "variations.stock.warehouse_ref", // Populate warehouse reference
      //     model: "Warehouse", // The model to populate (should match your Warehouse model)
      //   },
      // ];
    } else {
      filter = {
        "variations.stock.stock_qty": { $lt: 10 }, // No warehouse filter, just quantity < 10
        isDeleted: false,
        draft: false,
        qc_status: "approved",
        product_name: { $regex: `${name}`, $options: "i" },
      };

      // populateQuery = [
      //   {
      //     path: "variations.stock.warehouse_ref", // Populate warehouse reference
      //     model: "Warehouse", // The model to populate (should match your Warehouse model)
      //   },
      // ];
    }

    // Query products with the filter and populate warehouse_ref
    const products = await Product.find(filter).populate(populateQuery)
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 });

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
exports.searchQcProductsByStatus = async (req, res) => {
  const { name } = req.query;
  const { status } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }


  try {
    // Case-insensitive search for products whose names start with the provided term
    const products = await Product.find({
      product_name: { $regex: `${name}`, $options: "i" },
      isDeleted: false,
      draft: false,
      qc_status: status
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found", data: products });
    }

    return res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDraftProductsByCategorySubCategory = async (req, res) => {
  try {
    const { warehouseId, categoryName, subCategoryName, warehouseName } = req.params;
    const filter = {};
    if (warehouseName) {
      const warehouse = await Warehouse.find({ warehouse_name: warehouseName });
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      filter.warehouse_ref = warehouse[0]._id;
    }
    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const category = await Category.findOne({ category_name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    filter.category_ref = category._id;
    let subCategory;
    if (subCategoryName != "null") {
      subCategory = await SubCategory.findOne({ sub_category_name: subCategoryName, category_ref: category._id });
      if (!subCategory) {
        return res.status(404).json({ message: "Sub-category not found" });
      }
      filter.sub_category_ref = subCategory._id;
    }
    filter.isDeleted = false;
    filter.draft = true;
    filter.qc_status = "approved"


    // const products = await Product.find({ warehouse_ref: warehouse[0]._id, category_ref: categoryId, sub_category_ref: subCategoryId, isDeleted: false, draft: true, qc_status: "approved" }).populate("Brand category_ref sub_category_ref warehouse_ref")
    const products = await Product.find(filter).populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();
    res.status(200).json({ message: "Draft Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};
exports.getLowStockProductsByCategorySubCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName, warehouseName } = req.params;
    const filter = {};
    if (warehouseName) {
      const warehouse = await Warehouse.find({ warehouse_name: warehouseName });
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      filter.warehouse_ref = warehouse[0]._id;
    }
    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const category = await Category.findOne({ category_name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    filter.category_ref = category._id;
    let subCategory;
    if (subCategoryName != "null") {
      subCategory = await SubCategory.findOne({ sub_category_name: subCategoryName, category_ref: category._id });
      if (!subCategory) {
        return res.status(404).json({ message: "Sub-category not found" });
      }
      filter.sub_category_ref = subCategory._id;
    }
    filter.isDeleted = false;
    filter.draft = false;
    filter.qc_status = "approved"
    const products = await Product.find({ ...filter, "variations.stock.stock_qty": { $lt: 10 } }).populate("Brand category_ref sub_category_ref")
      .sort({ created_time: -1 })
      .exec();
    res.status(200).json({ message: "Low Stock Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};

exports.getProductsByCategorySubCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName, warehouseName } = req.params;
    const filter = {}
    if (warehouseName) {
      const warehouse = await Warehouse.find({ warehouse_name: warehouseName });
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      filter.warehouse_ref = warehouse[0]._id;
    }
    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const category = await Category.findOne({ category_name: categoryName });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    filter.category_ref = category._id;
    let subCategory;
    if (subCategoryName != "null") {
      subCategory = await SubCategory.findOne({ sub_category_name: subCategoryName, category_ref: category._id });
      if (!subCategory) {
        return res.status(404).json({ message: "Sub-category not found" });
      }
      filter.sub_category_ref = subCategory._id;
    }
    filter.isDeleted = false;
    filter.draft = false;
    filter.qc_status = "approved";

    const products = await Product.find(filter).populate("Brand category_ref sub_category_ref")
      .sort({ created_time: -1 })
      .exec();
    res.status(200).json({ message: "Products retrieved successfully", data: products });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
};
exports.searchQcProductsByStatus = async (req, res) => {
  const { name } = req.query;
  const { status } = req.params;

  if (!name) {
    return res.status(400).json({ message: "Search term is required" });
  }
  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }


  try {

    let products = await Product.find({
      sku: { $regex: `${name}`, $options: "i" },
      isDeleted: false,
      draft: false,
      qc_status: status
    })
      .populate("Brand category_ref sub_category_ref warehouse_ref")
      .sort({ created_time: -1 })
      .exec();
    if (products.length === 0) {
      products = await Product.find({
        product_name: { $regex: `${name}`, $options: "i" },
        isDeleted: false,
        draft: false,
        qc_status: status
      })
        .populate("Brand category_ref sub_category_ref warehouse_ref")
        .sort({ created_time: -1 })
        .exec();
    }

    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "No products found", data: products });
    }

    return res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.addSubcategoryToProducts = async (req, res) => {
  try {
    const { subcategoryId, productIds } = req.body;
    console.log("addSubcategoryToProducts",productIds,"productIds",(typeof productIds),"productIds instanceof Array",(productIds instanceof Array));
    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid subcategory ID" });
    }

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ success: false, message: "Product IDs must be an array" });
    }

    // Check if subcategory exists
    const subcategoryExists = await SubCategory.exists({ _id: subcategoryId });
    if (!subcategoryExists) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    // Update products that don't already have this subcategory
    const result = await Product.updateMany(
      {
        _id: { $in: productIds },
        sub_category_ref: { $nin: [subcategoryId] } // Only products that don't have this subcategory
      },
      {
        $addToSet: { sub_category_ref: subcategoryId } // $addToSet prevents duplicates
      }
    );

    res.status(200).json({
      success: true,
      message: `Subcategory added to ${result.modifiedCount} products`,
      data: result
    });
  } catch (error) {
    console.error("Error adding subcategory to products:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeSubcategoryFromProducts = async (req, res) => {
  try {
    console.log("removeSubcategoryFromProducts");
    const { subcategoryId, productIds } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({ success: false, message: "Invalid subcategory ID" });
    }

    if (!Array.isArray(productIds)) {
      return res.status(400).json({ success: false, message: "Product IDs must be an array" });
    }

    // Check if subcategory exists
    const subcategoryExists = await SubCategory.exists({ _id: subcategoryId });
    if (!subcategoryExists) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }
    console.log("subcategoryExists", subcategoryExists);
    // First find products that have more than one subcategory and contain the target subcategory
    const productsToUpdate = await Product.find({
      _id: { $in: productIds },
      $and: [
        { sub_category_ref: { $in: [subcategoryId] } },
        { $expr: { $gt: [{ $size: "$sub_category_ref" }, 1] } }
      ]
    });

    console.log("productsToUpdate", productsToUpdate);
    const productIdsToUpdate = productsToUpdate.map(p => p._id);

    // Remove the subcategory from eligible products
    const result = await Product.updateMany(
      {
        _id: { $in: productIdsToUpdate }
      },
      {
        $pull: { sub_category_ref: subcategoryId }
      }
    );

    res.status(200).json({
      success: true,
      message: `Subcategory removed from ${result.modifiedCount} products. ${productIds.length - productIdsToUpdate.length} products were not modified because they only have one subcategory.`,
      data: result
    });
  } catch (error) {
    console.error("Error removing subcategory from products:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
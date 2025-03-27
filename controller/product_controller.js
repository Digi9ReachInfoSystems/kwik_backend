const mongoose = require("mongoose");
const Product = require("../models/product_model");
const Category = require("../models/category_model");
const ZoneRack = require("../models/zoneRack_model");
const SubCategory = require("../models/sub_category_model");
const Warehouse = require("../models/warehouse_model");
const Brand = require("../models/brand_model");
const User = require("../models/user_models");
const Order = require("../models/order_model");

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

// Update a product by ID
exports.updateProduct = async (req, res) => {
  const productId = req.params.productId;
  const updatedData = req.body.updatedData;
  const isQcRequired = req.body.isQcRequired;
  console.dir(req.body, { depth: null });

  if (isQcRequired) {
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

      return {
        ...variation,
        _id: variation._id,
      };
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
    const drafts = await Product.find({
      isDeleted: false,
      draft: false,
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
        isDeleted : false,
        draft : false,
        qc_status : "approved",
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
    const { brandId } = req.body;
    const products = await Product.find({ Brand: brandId, isDeleted: false, draft: false, qc_status: "approved" }).populate("Brand category_ref sub_category_ref")
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
      product_name: { $regex: `^${name}`, $options: "i" },
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
      product_name: { $regex: `^${name}`, $options: "i" },
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
    const products = await Product.find({ ...filter, "variations.stock.stock_qty": { $lt: 10 } }).populate("Brand category_ref sub_category_ref warehouse_ref")
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
    product.warehouse_ref.push(warehouse_ref);
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
    const { cartId } = req.query;
    const user = await User.findOne({ UID: userId })
      .populate('cart_products.product_ref')
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.dir(user);

    const orders = await Order.find({ user_ref: user._id }).populate('products.product_ref').exec();

    let recommendedProducts = [];
    if (orders.length > 0) {
      const orderedCategories = orders.flatMap(order =>
        order.products.map(product => product.product_ref.category_ref)
      );
      const uniqueCategories = [...new Set(orderedCategories.map(cat => cat.toString()))];
      console.log("uniqueCategories", uniqueCategories);
      const randomCategories = getRandomCategories(uniqueCategories, 4);
      console.log("randomCategories", randomCategories);

      for (const category of randomCategories) {
        const productsInCategory = await Product.aggregate([
          { $match: { category_ref: category } },
          { $sample: { size: 10 } }
        ]).exec();
        recommendedProducts = [...recommendedProducts, ...getRandomProducts(productsInCategory, 3)]; // Adjust number to pick from each category
        if (recommendedProducts.length >= 10) break;
      }
      if (recommendedProducts.length >= 10) {
        return res.status(200).json({ message: "Recomanded products retrieved successfully", data: getUniqueProducts(recommendedProducts).slice(0, 10) });
      }
    }
    if (user.cart_products.length > 0 && recommendedProducts.length < 10) {
      const cartCategories = user.cart_products.map(cartProduct => cartProduct.product_ref.category_ref);
      const uniqueCartCategories = [...new Set(cartCategories.map(cat => cat.toString()))];
      const randomCategoriesFromCart = getRandomCategories(uniqueCartCategories, 3); // Adjust number of categories as needed

      for (const category of randomCategoriesFromCart) {
        const productsInCartCategory = await Product.aggregate([
          { $match: { category_ref: new mongoose.Types.ObjectId(category) } },
          { $sample: { size: 10 } }
        ]).exec();
        recommendedProducts = [...recommendedProducts, ...getRandomProducts(productsInCartCategory, 3)];
        if (recommendedProducts.length >= 10) break;
      }

      if (recommendedProducts.length >= 10) {
        return res.status(200).json({ message: "Recomanded products retrieved successfully", data: getUniqueProducts(recommendedProducts).slice(0, 10) });
      }
    }
    if (user.selected_Address && recommendedProducts.length < 10) {
      const pincode = user.selected_Address.pincode;
      const warehouse = await Warehouse.findOne({ picode: { $in: [pincode] } });

      if (warehouse) {
        const warehouseProducts = await Product.aggregate([
          { $match: { warehouse_ref: warehouse._id } },
          { $sample: { size: 10 } }]
        ).exec();
        recommendedProducts = [...recommendedProducts, ...getRandomProducts(warehouseProducts, 3)];
        if (recommendedProducts.length >= 10) return res.status(200).json({ message: "Recomanded products retrieved successfully", data: recommendedProducts.slice(0, 10) });
      }
    }

    if (recommendedProducts.length < 10) {
      const defaultCategory = await Category.findById(cartId);

      if (defaultCategory) {
        const productsInDefaultCategory = await Product.aggregate([
          { $match: { category_ref: defaultCategory._id } },
          { $sample: { size: 10 } }
        ]).exec();
        recommendedProducts = [...recommendedProducts, ...getRandomProducts(productsInDefaultCategory, 3)];
        if (recommendedProducts.length >= 10) return res.status(200).json({ message: "Recomanded products retrieved successfully", data: recommendedProducts.slice(0, 10) });
      }
    }

    return res.status(200).json({ message: "Recomanded products retrieved successfully", data: getUniqueProducts(recommendedProducts).slice(0, 10) });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving recomanded products", error: error.message });
  }
};

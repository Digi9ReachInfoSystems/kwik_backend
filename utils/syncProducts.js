const mongoose = require("mongoose");
const Product = require("../models/product_model");
const Brand = require("../models/brand_model"); // Ensure Brand model is imported
const Category = require("../models/category_model");
const SubCategory = require("../models/sub_category_model");
const client = require("./elasticsearch");
const connectDB = require("../config/database");

connectDB();

const syncProducts = async () => {
  try {
    // Ensure all models are registered before querying
    if (!mongoose.models.Brand) {
      require("../models/brand_model");
    }
    if (!mongoose.models.Category) {
      require("../models/category_model");
    }
    if (!mongoose.models.SubCategory) {
      require("../models/sub_category_model");
    }

    const products = await Product.find()
      .populate("Brand") // Ensure correct reference name
      .populate("category_ref")
      .populate("sub_category_ref");

    if (products.length === 0) {
      console.log("No products found to sync.");
      return;
    }

    const body = products.flatMap((doc) => [
      { index: { _index: "products", _id: doc._id.toString() } },
      {
        product_name: doc.product_name,
        product_des: doc.product_des,
        product_image: doc.product_image,
        Brand: doc.Brand ? doc.Brand.brand_name : null, // Use brand_name instead of ObjectId
        category_ref: doc.category_ref ? doc.category_ref.category_name : null,
        sub_category_ref: doc.sub_category_ref ? doc.sub_category_ref.sub_category_name : null,
        sku: doc.sku,
        created_time: doc.created_time,
      },
    ]);

    console.log("Sending bulk request to Elasticsearch...");

    const bulkResponse = await client.bulk({ refresh: true, body });

    console.log("Bulk Response:", bulkResponse); // Log the entire response

    if (bulkResponse && bulkResponse.errors) {
      console.error("Errors occurred during bulk indexing:", bulkResponse.errors);
    } else {
      console.log("All products indexed successfully");
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error syncing products:", error);
    mongoose.connection.close();
  }
};

syncProducts();
const fs          = require('fs');
const csv         = require('csv-parser');
const mongoose    = require('mongoose');
const Product     = require('../models/tempProduct_model');
const Brand       = require('../models/brand_model');
const Category    = require('../models/category_model');
const SubCategory = require('../models/sub_category_model');
const Warehouse   = require('../models/warehouse_model');

exports.bulkUploadProducts = async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Missing CSV file' });
    }
  
    const rows = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', row => rows.push(row))
      .on('end', async () => {
        try {
          for (const row of rows) {
            const {
              sku,
              product_name,
              product_des,
              product_image,
              brand_name,
              category_name,
              sub_category_name,
              variationsJSON,
              draft,
              sensible_product
            } = row;
  
            // Lookup Brand
            const brand = await Brand.findOne({ brand_name: brand_name.trim() });
            if (!brand) throw new Error(`Brand not found: ${brand_name}`);
  
            // Lookup Category
            const category = await Category.findOne({ category_name: category_name.trim() });
            if (!category) throw new Error(`Category not found: ${category_name}`);
  
            // Lookup SubCategories
            const subNames = sub_category_name.split(';').map(s => s.trim()).filter(Boolean);
            const subCats = await SubCategory.find({
              sub_category_name: { $in: subNames },
              category_ref: category._id
            });
            if (subCats.length !== subNames.length) {
              const found = subCats.map(s => s.sub_category_name);
              const missing = subNames.filter(n => !found.includes(n));
              throw new Error(`SubCategory not found: ${missing.join(', ')}`);
            }
            const subCatIds = subCats.map(sc => sc._id);
  
            // Parse multiple variations
            const varEntries = JSON.parse(variationsJSON);
  
            // Build variation objects with stock lookups
            const variationObjs = [];
            for (const v of varEntries) {
              // Resolve multiple stock entries
              const stocks = [];
              for (const entry of v.stock) {
                const wh = await Warehouse.findOne({ warehouse_name: entry.warehouse_name.trim() });
                if (!wh) throw new Error(`Warehouse not found: ${entry.warehouse_name}`);
                stocks.push({
                  warehouse_ref: wh._id,
                  stock_qty:     entry.stockQty,
                  visibility:    entry.stockVisibility,
                  zone:          entry.stockZone,
                  rack:          entry.stockRack
                });
              }
  
              variationObjs.push({
                Qty:           v.Qty,
                unit:          v.unit,
                MRP:           v.MRP,
                buying_price:  v.buying_price,
                selling_price: v.selling_price,
                stock:         stocks,
                Highlight:     v.Highlight || [],
                info:          v.info      || []
              });
            }
  
            // Find or create product by SKU
            let product = await Product.findOne({ sku });
            const images  = product_image.split(',').map(u => u.trim()).filter(Boolean);
            const isDraft = draft === 'true';
            const isSens  = sensible_product === 'true';
  
            if (product) {
              // Union images
              product.product_image = Array.from(new Set([
                ...product.product_image,
                ...images
              ]));
  
              // Overwrite brand/category/sub-cats
              product.Brand            = brand._1;
              product.category_ref     = category._id;
              product.sub_category_ref = Array.from(new Set([
                ...product.sub_category_ref.map(String),
                ...subCatIds.map(String)
              ])).map(id => mongoose.Types.ObjectId(id));
  
              // Merge each variation
              for (const varObj of variationObjs) {
                const existingVar = product.variations.find(v =>
                  v.unit === varObj.unit && v.Qty === varObj.Qty
                );
                if (existingVar) {
                  // Append new stock entries
                  existingVar.stock.push(...varObj.stock);
                  // Merge highlights & info
                  existingVar.Highlight = Array.from(
                    new Set([
                      ...existingVar.Highlight.map(JSON.stringify),
                      ...varObj.Highlight.map(JSON.stringify)
                    ])
                  ).map(JSON.parse);
                  existingVar.info = Array.from(
                    new Set([
                      ...existingVar.info.map(JSON.stringify),
                      ...varObj.info.map(JSON.stringify)
                    ])
                  ).map(JSON.parse);
                } else {
                  product.variations.push(varObj);
                }
              }
  
              // Update flags
              product.draft            = isDraft;
              product.sensible_product = isSens;
  
            } else {
              // Create new product
              product = new Product({
                sku,
                product_name,
                product_des,
                product_image:    images,
                Brand:            brand._id,
                category_ref:     category._id,
                sub_category_ref: subCatIds,
                variations:       variationObjs,
                draft:            isDraft,
                sensible_product: isSens
              });
            }
  
            await product.save();
          }
  
          // Cleanup
          fs.unlinkSync(req.file.path);
          res.json({ message: 'Bulk upload completed.' });
  
        } catch (err) {
          console.error('Bulk upload error:', err);
          res.status(400).json({ message: err.message });
        }
      });
  };
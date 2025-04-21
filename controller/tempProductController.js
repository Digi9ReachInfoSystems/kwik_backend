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
              variationQty,
              variationUnit,
              variationMRP,
              variationBuyingPrice,
              variationSellingPrice,
              warehouse_name,      // now a string
              stockQty,
              stockVisibility,
              stockZone,
              stockRack,
              highlightJSON,
              infoJSON,
              draft,
              sensible_product
            } = row;
  
            // 1️⃣ Brand lookup
            const brand = await Brand.findOne({ brand_name: brand_name.trim() });
            if (!brand) throw new Error(`Brand not found: ${brand_name}`);
  
            // 2️⃣ Category lookup
            const category = await Category.findOne({ category_name: category_name.trim() });
            if (!category) throw new Error(`Category not found: ${category_name}`);
  
            // 3️⃣ SubCategory lookups
            const subNames = sub_category_name.split(';').map(s=>s.trim()).filter(Boolean);
            const subCats = await SubCategory.find({
              sub_category_name: { $in: subNames },
              category_ref: category._id
            });
            if (subCats.length !== subNames.length) {
              const found = subCats.map(s=>s.sub_category_name);
              const missing = subNames.filter(n=>!found.includes(n));
              throw new Error(`SubCategory not found: ${missing.join(', ')}`);
            }
            const subCatIds = subCats.map(sc=>sc._id);
  
            // 4️⃣ Warehouse lookup
            const warehouse = await Warehouse.findOne({ warehouse_name: warehouse_name.trim() });
            if (!warehouse) throw new Error(`Warehouse not found: ${warehouse_name}`);
            const warehouseId = warehouse._id;
  
            // 5️⃣ Build variation
            const variationObj = {
              Qty:           Number(variationQty),
              unit:          variationUnit,
              MRP:           Number(variationMRP),
              buying_price:  Number(variationBuyingPrice),
              selling_price: Number(variationSellingPrice),
              stock: [{
                warehouse_ref: warehouseId,
                stock_qty:     Number(stockQty),
                visibility:    stockVisibility === 'true',
                zone:          stockZone,
                rack:          stockRack
              }],
              Highlight: JSON.parse(highlightJSON || '[]'),
              info:      JSON.parse(infoJSON      || '[]')
            };
  
            // 6️⃣ Find or create product
            let product = await Product.findOne({ sku });
            const images = product_image.split(',').map(u=>u.trim()).filter(Boolean);
            const isDraft = draft === 'true';
            const isSensible = sensible_product === 'true';
  
            if (product) {
              // — update existing —
              product.product_image = Array.from(new Set([
                ...product.product_image,
                ...images
              ]));
              product.Brand        = brand._id;
              product.category_ref = category._id;
              product.sub_category_ref = Array.from(new Set([
                ...product.sub_category_ref.map(String),
                ...subCatIds.map(String)
              ])).map(id=>mongoose.Types.ObjectId(id));
              product.warehouse_ref = Array.from(new Set([
                ...product.warehouse_ref.map(String),
                String(warehouseId)
              ])).map(id=>mongoose.Types.ObjectId(id));
  
              const existingVar = product.variations.find(v=>
                v.unit === variationObj.unit && v.Qty === variationObj.Qty
              );
              if (existingVar) {
                existingVar.stock.push(...variationObj.stock);
                existingVar.Highlight = Array.from(
                  new Set([
                    ...existingVar.Highlight.map(JSON.stringify),
                    ...variationObj.Highlight.map(JSON.stringify)
                  ])
                ).map(JSON.parse);
                existingVar.info = Array.from(
                  new Set([
                    ...existingVar.info.map(JSON.stringify),
                    ...variationObj.info.map(JSON.stringify)
                  ])
                ).map(JSON.parse);
              } else {
                product.variations.push(variationObj);
              }
  
              product.draft            = isDraft;
              product.sensible_product = isSensible;
  
            } else {
              // — create new —
              product = new Product({
                sku,
                product_name,
                product_des,
                product_image:    images,
                Brand:            brand._id,
                category_ref:     category._id,
                sub_category_ref: subCatIds,
                warehouse_ref:    [warehouseId],
                variations:       [variationObj],
                draft:            isDraft,
                sensible_product: isSensible
              });
            }
  
            await product.save();
          }
  
          // cleanup and respond
          fs.unlinkSync(req.file.path);
          res.json({ message: 'Bulk upload completed.' });
  
        } catch (err) {
          console.error('Bulk upload error:', err);
          res.status(400).json({ message: err.message });
        }
      });
  };
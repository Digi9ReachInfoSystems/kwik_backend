const fs          = require('fs');
const csv         = require('csv-parser');
const mongoose    = require('mongoose');
const Product     = require('../models/tempProduct_model');
const Brand       = require('../models/brand_model');
const Category    = require('../models/category_model');
const SubCategory = require('../models/sub_category_model');

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
            stockWarehouseRef,
            stockQty,
            stockVisibility,
            stockZone,
            stockRack,
            highlightJSON,
            infoJSON,
            draft,
            sensible_product
          } = row;

          // 1️⃣ Lookup Brand by name
          const brand = await Brand.findOne({ brand_name: brand_name.trim() });
          if (!brand) throw new Error(`Brand not found: ${brand_name}`);

          // 2️⃣ Lookup Category by name
          const category = await Category.findOne({ category_name: category_name.trim() });
          if (!category) throw new Error(`Category not found: ${category_name}`);

          // 3️⃣ Lookup SubCategories by name under that Category
          const subNames = sub_category_name.split(';').map(s => s.trim()).filter(Boolean);
          const subCats = await SubCategory.find({
            sub_category_name: { $in: subNames },
            category_ref: category._id
          });
          if (subCats.length !== subNames.length) {
            const foundNames = subCats.map(s => s.sub_category_name);
            const missing = subNames.filter(n => !foundNames.includes(n));
            throw new Error(`SubCategory not found: ${missing.join(', ')}`);
          }
          const subCatIds = subCats.map(sc => sc._id);

          // 4️⃣ Build variation object
          const variationObj = {
            Qty:           Number(variationQty),
            unit:          variationUnit,
            MRP:           Number(variationMRP),
            buying_price:  Number(variationBuyingPrice),
            selling_price: Number(variationSellingPrice),
            stock: [{
              warehouse_ref: stockWarehouseRef,
              stock_qty:     Number(stockQty),
              visibility:    stockVisibility === 'true',
              zone:          stockZone,
              rack:          stockRack
            }],
            Highlight: JSON.parse(highlightJSON || '[]'),
            info:      JSON.parse(infoJSON      || '[]')
          };

          // 5️⃣ Find or create Product by SKU
          let product = await Product.findOne({ sku });
          const images = product_image.split(',').map(u => u.trim()).filter(Boolean);
          const isDraft = draft === 'true';
          const isSensible = sensible_product === 'true';

          if (product) {
            // — Update existing product —

            // Union images
            product.product_image = Array.from(new Set([
              ...product.product_image,
              ...images
            ]));

            // Overwrite brand/category (or skip if you prefer to keep)
            product.Brand        = brand._id;
            product.category_ref = category._id;

            // Union sub-categories
            product.sub_category_ref = Array.from(new Set([
              ...product.sub_category_ref.map(String),
              ...subCatIds.map(String)
            ])).map(id => mongoose.Types.ObjectId(id));

            // Union warehouses
            product.warehouse_ref = Array.from(new Set([
              ...product.warehouse_ref.map(String),
              stockWarehouseRef
            ])).map(id => mongoose.Types.ObjectId(id));

            // Merge or append variation
            const existingVar = product.variations.find(v =>
              v.unit === variationObj.unit && v.Qty === variationObj.Qty
            );
            if (existingVar) {
              existingVar.stock.push(...variationObj.stock);
              // Merge highlights & info without duplicates
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

            // Update flags
            product.draft            = isDraft;
            product.sensible_product = isSensible;

          } else {
            // — Create new product —
            product = new Product({
              sku,
              product_name,
              product_des,
              product_image:    images,
              Brand:            brand._id,
              category_ref:     category._id,
              sub_category_ref: subCatIds,
              warehouse_ref:    [stockWarehouseRef],
              variations:       [variationObj],
              draft:            isDraft,
              sensible_product: isSensible
            });
          }

          await product.save();
        }

        // Remove temp file
        fs.unlinkSync(req.file.path);
        res.json({ message: 'Bulk upload completed.' });

      } catch (err) {
        console.error('Bulk upload error:', err);
        res.status(400).json({ message: err.message });
      }
    });
};

const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Product = require('../models/tempProduct_model');
const Brand = require('../models/brand_model');
const Category = require('../models/category_model');
const SubCategory = require('../models/sub_category_model');
const Warehouse = require('../models/warehouse_model');

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
                        draft,
                        sensible_product,
                        variationQty,
                        variationUnit,
                        variationMRP,
                        variationBuyingPrice,
                        variationSellingPrice,
                        variationHighlight,
                        variationInfo,
                        variationStockWarehouseName,
                        variationStockStockQty,
                        variationStockStockVisibility,
                        variationStockStockZone,
                        variationStockStockRack
                    } = row;

                    // 1) Brand / Category / SubCategory lookups (omitted for brevity)
                    const brand = await Brand.findOne({ brand_name: brand_name.trim() });
                    const category = await Category.findOne({ category_name: category_name.trim() });
                    const subNames = sub_category_name.split(';').map(s => s.trim()).filter(Boolean);
                    const subCats = await SubCategory.find({
                        sub_category_name: { $in: subNames },
                        category_ref: category._id
                    });
                    const subCatIds = subCats.map(s => s._id);

                    // 2) Normalize images
                    const images = (product_image || '')
                        .split(',').map(u => u.trim()).filter(Boolean);

                    // 3) Find or create product
                    let product = await Product.findOne({ sku });
                    const isDraft = draft === 'true';
                    const isSens = sensible_product === 'true';

                    if (!product) {
                        product = new Product({
                            sku,
                            product_name,
                            product_des,
                            product_image: images,
                            Brand: brand._id,
                            category_ref: category._id,
                            sub_category_ref: subCatIds,
                            variations: [],
                            draft: isDraft,
                            sensible_product: isSens,
                            warehouse_ref: []
                        });
                    } else {
                        product.product_image = Array.from(new Set([
                            ...product.product_image,
                            ...images
                        ]));
                        product.Brand = brand._id;
                        product.category_ref = category._id;
                        product.sub_category_ref = Array.from(new Set([
                            ...product.sub_category_ref.map(String),
                            ...subCatIds.map(String)
                        ])).map(id => new mongoose.Types.ObjectId(id));
                        product.draft = isDraft;
                        product.sensible_product = isSens;
                    }

                    // 4) Single variation logic
                    const qty = Number(variationQty);
                    const unit = (variationUnit || '').trim();
                    if (qty > 0 && unit) {
                        let variation = product.variations.find(v =>
                            v.Qty === qty && v.unit === unit
                        );
                        if (!variation) {
                            variation = {
                                Qty: qty,
                                unit,
                                MRP: Number(variationMRP),
                                buying_price: Number(variationBuyingPrice),
                                selling_price: Number(variationSellingPrice),
                                stock: [],
                                Highlight: [{}],
                                info: [{}]
                            };
                            product.variations.push(variation);
                        } else {
                            variation.MRP = Number(variationMRP);
                            variation.buying_price = Number(variationBuyingPrice);
                            variation.selling_price = Number(variationSellingPrice);
                            if (!variation.Highlight.length) variation.Highlight = [{}];
                            if (!variation.info.length) variation.info = [{}];
                        }

                        // parse Key:Value pairs
                        const parseKV = str => (str || '').split(',')
                            .map(e => e.trim())
                            .map(e => {
                                const [k, ...r] = e.split(':');
                                return r.length ? { [k.trim()]: r.join(':').trim() } : null;
                            })
                            .filter(Boolean);

                        // Merge highlights into single object
                        const hlObj = variation.Highlight[0];
                        for (const h of parseKV(variationHighlight)) {
                            Object.assign(hlObj, h);
                        }
                        variation.Highlight[0] = hlObj;

                        // Merge info into single object
                        const infoObj = variation.info[0];
                        for (const i of parseKV(variationInfo)) {
                            Object.assign(infoObj, i);
                        }
                        variation.info[0] = infoObj;

                        // 5) Stock merge
                        const whName = (variationStockWarehouseName || '').trim();
                        const stockQty = Number(variationStockStockQty);
                        if (whName && stockQty > 0) {
                            const wh = await Warehouse.findOne({ warehouse_name: whName });
                            if (!wh) throw new Error(`Warehouse not found: ${whName}`);

                            const existingStock = variation.stock.find(s =>
                                String(s.warehouse_ref) === String(wh._id)
                            );
                            if (existingStock) {
                                existingStock.stock_qty += stockQty;
                                existingStock.visibility = variationStockStockVisibility === 'true';
                                existingStock.zone = variationStockStockZone;
                                existingStock.rack = variationStockStockRack;
                            } else {
                                variation.stock.push({
                                    warehouse_ref: wh._id,
                                    stock_qty: stockQty,
                                    visibility: variationStockStockVisibility === 'true',
                                    zone: variationStockStockZone,
                                    rack: variationStockStockRack
                                });
                            }
                            const hasWhRef = product.warehouse_ref.some(id =>
                                String(id) === String(wh._id)
                            );
                            if (!hasWhRef) {
                                product.warehouse_ref.push(wh._id);
                            }
                        }
                        console.log("variation", variation)
                        product.variations = product.variations.map(v => {
                            if (String(v.unit) === String(variation.unit)) {
                                return variation;
                            }
                            return v;
                        })
                        // 6) Tell Mongoose “variations” changed
                        product.markModified('variations');
                    }
                    console.log("product", product)
                    // 7) One final save
                    await product.save();
                }

                fs.unlinkSync(req.file.path);
                res.json({ message: 'Bulk upload completed.' });
            } catch (err) {
                console.error('Bulk upload error:', err);
                res.status(400).json({ message: err.message });
            }
        });
};
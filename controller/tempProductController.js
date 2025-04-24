const fs = require('fs');
const csv = require('csv-parser');
const streamifier = require('streamifier');
const mongoose = require('mongoose');
const Product = require('../models/product_model');
const Brand = require('../models/brand_model');
const Category = require('../models/category_model');
const SubCategory = require('../models/sub_category_model');
const Warehouse = require('../models/warehouse_model');
const TempProduct = require('../models/tempProduct_model');
const { uploadFileToFirebase } = require('../utils/firebaseServices');

exports.bulkUploadProducts = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Missing CSV file' });
    }
    try {
        const publicUrl = await uploadFileToFirebase(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );
        console.log(`CSV uploaded to: ${publicUrl}`);

        const rows = [];
        await new Promise((resolve, reject) => {
            streamifier
                .createReadStream(req.file.buffer)
                .pipe(csv())
                .on('data', row => rows.push(row))
                .on('end', resolve)
                .on('error', reject);
        });
        const failedRows = [];
        // fs.createReadStream(req.file.path)
        //     .pipe(csv())
        //     .on('data', row => rows.push(row))
        //     .on('end', async () => {
        //         try {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const {
                    sku,
                    product_name,
                    product_des,
                    product_image,
                    product_video,
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
                let product = await TempProduct.findOne({ sku });
                const isDraft = draft === 'true';
                const isSens = sensible_product === 'true';

                if (!product) {
                    product = new TempProduct({
                        sku,
                        product_name,
                        product_des,
                        product_image: images,
                        product_video: product_video,
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
                    product.product_video = product_video;
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
                    product.variations = product.variations.map(v => {
                        if (String(v.unit) === String(variation.unit)) {
                            return variation;
                        }
                        return v;
                    })
                    // 6) Tell Mongoose “variations” changed
                    product.markModified('variations');
                }

                // 7) One final save
                await product.save();
            } catch (error) {
                // Store the row and error details if something goes wrong
                failedRows.push({ rowNumber: i + 2, row, error: error.message });
            }
        }
        // fs.unlinkSync(req.file.path);
        if (failedRows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bulk upload completed with errors.',
                failedRows
            });
        }
        res.json({ success: true, message: 'Bulk upload completed.' });
    } catch (err) {
        console.error('Bulk upload error:', err);
        res.status(400).json({ success: false, message: err.message });
    }
    // });
};

exports.migrateTempToProduct = async (req, res) => {
    try {
        const tempProducts = await TempProduct.find().lean();
        const moved = [];
        const skipped = [];

        for (const temp of tempProducts) {
            const exists = await Product.exists({ sku: temp.sku });
            if (exists) {
                skipped.push(temp.sku);
                continue;
            }

            const { _id, ...productData } = temp;

            const newProduct = new Product(productData);
            await newProduct.save();

            await TempProduct.deleteOne({ _id });

            moved.push(temp.sku);
        }

        return res.json({
            success: true,
            message: "Migration complete",
            movedCount: moved.length,
            movedSKUs: moved,
            skippedCount: skipped.length,
            skippedSKUs: skipped,
        });
    } catch (err) {
        console.error("Migration error:", err);
        return res.status(500).json({ success: false, message: "Migration failed", error: err.message });
    }
};

exports.getAllTempProducts = async (req, res) => {
    try {
        const products = await TempProduct.find()
            .populate("Brand category_ref sub_category_ref warehouse_ref")
            .sort({ created_time: -1 })
            .exec();
        res.status(200).json({ success: true, message: "Products retrieved successfully", data: products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, message: "Error fetching products", error: error.message });
    }
};

exports.getTempProductsById = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await TempProduct.findById(productId)
            .populate("Brand category_ref sub_category_ref warehouse_ref")
            .sort({ created_time: -1 })
            .exec();
        res.status(200).json({ success: true, message: "Product retrieved successfully", data: product });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ success: false, message: "Error fetching product", error: error.message });
    }
};

exports.updateTempProduct = async (req, res) => {
    const productId = req.params.productId;
    const updatedData = req.body;
    console.dir(req.body, { depth: null });
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
        const updatedProduct = await TempProduct.findByIdAndUpdate(
            productId,
            updatedData,
            {
                new: true, // Return the updated document
                runValidators: true, // Run validation on the updated data
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res
            .status(200)
            .json({ message: "Product updated successfully", data: updatedProduct });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res
                .status(400)
                .json({ success: false, message: "Validation failed", errors: error.errors });
        }
        res
            .status(500)
            .json({ success: false, message: "Error updating product", error: error.message });
    }
};

exports.deleteTempProduct = async (req, res) => {
    const productId = req.params.productId;
    try {
        const deletedProduct = await TempProduct.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        res
            .status(200)
            .json({ success: true, message: "Product deleted successfully", data: deletedProduct });
    } catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Error deleting product", error: error.message });
    }
};
exports.searchTempProduct = async (req, res) => {
    try {
        const { name } = req.query;
        const product = await TempProduct.find({ product_name: { $regex: `${name}`, $options: "i" }, })
            .populate("Brand category_ref sub_category_ref warehouse_ref")
            .exec();
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, message: "Product retrieved successfully", data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error searching product", error: error.message });
    }
};
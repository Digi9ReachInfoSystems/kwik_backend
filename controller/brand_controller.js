const Brand = require('../models/brand_model'); // Adjust path as per your file structure



// Get all brands
exports.getAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find(); // Fetch all brands from the database

        res.status(200).json({ message: 'Brands retrieved successfully', data: brands });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching brands', error: error.message });
    }
};
// Add a new brand
exports.addBrand = async (req, res) => {
    try {
        const { brand_id, brand_name, brand_image, brand_des, brand_url } = req.body;

        // Validate required fields
        if (!brand_id || !brand_name || !brand_image || !brand_des) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newBrand = new Brand({
            brand_id,
            brand_name,
            brand_image,
            brand_des,
            brand_url,
        });

        const savedBrand = await newBrand.save();

        res.status(201).json({ message: 'Brand added successfully', data: savedBrand });
    } catch (error) {
        res.status(500).json({ message: 'Error adding brand', error: error.message });
    }
};

// Edit an existing brand
exports.editBrand = async (req, res) => {
    try {
        const brandId = req.params.id; // MongoDB Object ID of the brand to edit
        const updatedData = req.body;

        const updatedBrand = await Brand.findByIdAndUpdate(brandId, updatedData, {
            new: true, // Return the updated document
            runValidators: true, // Run validation on updated fields
        });

        if (!updatedBrand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        res.status(200).json({ message: 'Brand updated successfully', data: updatedBrand });
    } catch (error) {
        res.status(500).json({ message: 'Error updating brand', error: error.message });
    }
};

// Delete a brand
exports.deleteBrand = async (req, res) => {
    try {
        const brandId = req.params.id; // MongoDB Object ID of the brand to delete

        const deletedBrand = await Brand.findByIdAndDelete(brandId);

        if (!deletedBrand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        res.status(200).json({ message: 'Brand deleted successfully', data: deletedBrand });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting brand', error: error.message });
    }
};

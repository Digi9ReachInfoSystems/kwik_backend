const mongoose = require("mongoose");

// Define the Warehouse reference
const warehouseRefSchema = {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
};

// Define the ZoneRack schema
const zoneRackSchema = new mongoose.Schema({
    zone_name: {
        type: String,
        required: [true, "Zone is required"],
        trim: true, // To remove leading/trailing spaces
    },
    rack_name: {
        type: String,
        required: [true, "Rack is required"],
        trim: true, // To remove leading/trailing spaces
    },
    warehouse: warehouseRefSchema,
    created_time: {
        type: Date,
        required: true,
        default: Date.now,
    },

});

// Create and export the ZoneRack model
module.exports = mongoose.model("ZoneRack", zoneRackSchema);
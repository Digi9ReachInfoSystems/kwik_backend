const mongoose = require("mongoose");

// Define the Review schema
const reviewSchema = new mongoose.Schema({
    user_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },  // Reference to the User model
    comment: {
        type: String,
        required: true
    },  // Review comment
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },  // Rating given by the user (between 0 and 5)
    created_time: {
        type: Date,
        default: Date.now
    },  // Time when the review was created
});

// Create and export the Review model
module.exports = reviewSchema;

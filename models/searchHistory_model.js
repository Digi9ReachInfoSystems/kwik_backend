// models/SearchHistory.js
const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  result: [
    {
      product_name: {
        type: String,
        // required: true
      },
      product_image: [
        {
          type: String,
          // required: true
        }
      ],
      Brand: {
        type: String,
        // required: true
      },
      category_ref: {
        type: String,
        // required: true
      },
      sub_category_ref: {
        type: String,
        // required: true
      },
      sku: {
        type: String,
        // required: true
      },
      created_time: {
        type: Date,
        // required: true
      },
      score: {
        type: Number,
        // required: true
      }
    }
  ],
  query: {
    type: String,
    // required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});
module.exports = searchHistorySchema;

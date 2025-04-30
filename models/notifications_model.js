const mongoose = require("mongoose");
const User = require("./user_models");

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  user_ref: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
  ],
  redirect_type: {
    type: String,
    // required: true,
    default: null,
  },
  redirect_url: {
    type: String,
    default: null,
  },
  fcm_token: {
    type: String,
    default: null,
  },
  image_url: {
    type: String,
    default: null,
  },
  isDeleted: { type: Boolean, required: true, default: false },
  isRead: { type: Boolean, required: true, default: false },
  created_time: { type: Date, required: true, default: Date.now },
  scheduled_time: { type: Date }, // New field
});

module.exports = mongoose.model("Notification", notificationSchema);

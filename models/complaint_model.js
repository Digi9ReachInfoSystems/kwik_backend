const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  user_ref: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // assuming you have a User model
  order_ref: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },  // assuming you have an Order model
  complaint: { type: String, required: true },
  attachment: { type: String },  // Path to file or URL for the attachment
  status: { type: String, enum: ["pending", "resolved", "rejected"], default: "pending" },
}, {
  timestamps: true,  // Automatically adds createdAt and updatedAt
});

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;

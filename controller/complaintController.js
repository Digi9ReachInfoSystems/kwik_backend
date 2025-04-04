const Complaint = require("../models/complaint_model");
const User = require("../models/user_models");

exports.createComplaint = async (req, res) => {
  try {
    const { user_ref, order_ref, complaint, attachment } = req.body;
    const user= await User.findOne({UID:user_ref});
    if(!user){
      return res.status(404).json({message:"User not found"});
    }

    // Create a new complaint document
    const newComplaint = new Complaint({
      user_ref:user._id,
      order_ref,
      complaint,
      attachment
    });

    // Save the complaint to the database
    const savedComplaint = await newComplaint.save();

    // Return the saved complaint in the response
    res.status(201).json({
      message: "Complaint created successfully",
      complaint: savedComplaint,
    });
  } catch (err) {
    console.error("Error creating complaint:", err);
    res.status(500).json({ message: "Failed to create complaint", error: err.message });
  }
};

// Get all complaints
exports.getComplaints = async (req, res) => {
  try {
    // Fetch complaints from the database and populate user and order details
    const complaints = await Complaint.find()
    .populate("user_ref order_ref") 
    
    res.status(200).json({
      message: "Complaints retrieved successfully",
      complaints,
    });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints", error: err.message });
  }
};

exports.getComplaintsById = async (req, res) => {
  try {
    
    const complaints = await Complaint.findById(req.params.id)
      .populate("user_ref order_ref") 
    
    res.status(200).json({
      message: "Complaints retrieved successfully",
      complaints,
    });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints", error: err.message });
  }
};

exports.getComplaintsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const complaints = await Complaint.find({ user_ref: user_id })
    .populate("user_ref order_ref") ;
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};
exports.getComplaintsByOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const complaints = await Complaint.find({ order_ref: order_id })
    .populate("user_ref order_ref") ;
    res.status(200).json({message:"Complaints retrieved successfully",complaints});
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};



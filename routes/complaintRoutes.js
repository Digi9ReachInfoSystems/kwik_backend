const express = require("express");
const router = express.Router();
const {
    createComplaint,
    getComplaints,
    getComplaintsById,
    getComplaintsByUser,
    getComplaintsByOrder
} = require("../controller/complaintController");

// Route to create a new complaint
router.post("/create", createComplaint);

// Route to get all complaints
router.get("/", getComplaints);
router.get("/:id", getComplaintsById);
router.get("/user/:user_id", getComplaintsByUser);
router.get("/order/:order_id", getComplaintsByOrder);

module.exports = router;

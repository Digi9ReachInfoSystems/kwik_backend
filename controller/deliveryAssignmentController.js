// const DeliveryAssignment = require("../models/deliveryAssignmentModel");


// exports.getOrdersByDeliveryBoy = async (req, res) => {
//     try {
//         const { deliveryBoyId ,tum} = req.params;
//         const deliveryAssignments = await DeliveryAssignment.find({ delivery_boy_ref: deliveryBoyId }).exec();
//         res.status(200).json({ success: true, data: deliveryAssignments });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };
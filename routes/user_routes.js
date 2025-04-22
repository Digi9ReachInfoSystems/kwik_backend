const express = require("express");
const router = express.Router();
const userController = require("../controller/user_controller");

// Define specific routes first to avoid conflicts
// Get all users
router.get("/allusers", userController.getAllUsers);

// Get all blocked users
router.get("/blockedusers", userController.getBlockedUsers);

// Delivery boys account
router.get("/deliveryaccounts", userController.getDeliveryUserAccount);

// Block a user
router.put("/:userId/block", userController.blockUser);

// Unblock a user
router.put("/:userId/unblock", userController.unblockUser);

// Get a user by ID
router.get("/:userId", userController.getUserById);

// Create a new user
router.post("/create", userController.createUser);

// Edit user details
router.put("/:userId", userController.editUser);

// add a product Carts
router.post("/addtocart", userController.addProductToCart);
router.post("/increseqty", userController.increseCartProductQuantity);
router.post("/decreseqty", userController.decreaseCartProductQuantity);

router.put("/addAddress/:userId", userController.addAddress);
router.put("/select/address/change", userController.userSelectedAddressChange);
router.get("/getUserCart/:userId", userController.getUserCartById);
router.get("/get/userStats",userController.userStats);
router.put("/update/currentPincode",userController.updateCurrentPincode);
router.get("/get/searchHistory/:userId",userController.getsearchHistoryByUserId);
router.delete("/delete/searchHistory/:userId/:queryId",userController.removeSearchHistoryByUserIdandQueryId);
router.delete("/delete/allSearchHistory/:userId",userController.removeSearchHistoryByUserId);
router.post("/add/whislist",userController.addProductToWhislist);
router.post("/orderAgain",userController.orderAgainUserOrderId);
router.put("/updateaddress",userController.editAddress);
router.get("/get/deliveryboyApplicationByWarehouseId/:warehouseId/status/:status",userController.getDeliveryApplicationByWarehouseId);
router.put("/update/approveAppliaction",userController.approveDeliveryApplication);
router.put("/update/blockDeliveryboy",userController.blockDeliveryBoy);
router.get("/search/deliveryboyApplicationByWarehouseId/:warehouseId/status/:status",userController.searchDeliveryBoyApplication);
router.get("/get/availableTumTumDeliveryboyByWarehouseId/:warehouseId",userController.getDeliveryBoyForTumTumByWarehouseId);
router.get("/get/deliveryboys/admin",userController.getDeliveryboys);
router.get("/search/deliveryboys/admin",userController.searchDeliveryBoys);
router.get("/search/users",userController.searchUsers);
router.get("/get/users/admin",userController.getUsersAdmin);
module.exports = router;

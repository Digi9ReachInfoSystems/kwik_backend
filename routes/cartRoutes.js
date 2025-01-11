const express = require("express");
const router = express.Router();
const cartcontroller = require("../controller/cartController");



// router.use(cors());
// router.options("*", cors());

// Endpoint to fetch all cart items
router.get("/allcart", cartcontroller.getcart);


// Endpoint to add a product to the cart (initial quantity = 1)
router.post("/addtocart", cartcontroller.addtocart);



// Endpoint to increase product quantity by 1
router.put("/increaseqty", cartcontroller.increateqty);

// Endpoint to decrease product quantity by 1
router.put("/decreaseqty", cartcontroller.decreaseqty);
module.exports = router;
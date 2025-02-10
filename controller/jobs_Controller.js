const cartCleanupJob = require("../jobs/cartProductRemoval");


exports.cartCleanupJobController = async (req, res) => {
    try {
      return  await cartCleanupJob(res);
        // res.status(200).json({ message: "Cart cleanup Successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error starting cart cleanup job", error: error.message });
    }
}
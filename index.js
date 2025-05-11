const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http").Server(app);
const connectDB = require("./config/database");
const checkApiKey = require("./config/checkapikey");
const firebase = require("./config/firebase");
const userRoutes = require("./routes/user_routes");
const productRoutes = require("./routes/product_routes");
const brandRoutes = require("./routes/brand_routes");
const categoryRoutes = require("./routes/category_routes");
const subcategoryRoutes = require("./routes/sub_category_routes");
const warehouseRoutes = require("./routes/warehouse_routes");
const authRoutes = require("./routes/auth_Routes");
require("dotenv").config();
const searchRoutes = require("./routes/search_routes");
const searchHistoryRoutes = require("./routes/searchHistoryRoutes");
const homeUiRoutes = require("./routes/homepage_ui_controller_Routes");
const categoryUiRoutes = require("./routes/category_ui_routes");
const bannerRoutes = require("./routes/banner_Routes");
const couonRoutes = require("./routes/couponRoutes");
const jobRoutes = require("./routes/jobs_Routes");
const orderRoutes = require("./routes/order_Routes");
const superSaverUiRoutes = require("./routes/superSaver_page_ui_Routes");
const applicationManagementRoutes = require("./routes/applicationManagementRoutes");
const complaintsRoutes = require("./routes/complaintRoutes");
const orderRouteRoutes = require("./routes/orderRouteRoute");
const deliveryAssignmentRoutes = require("./routes/deliveryAssignmentRoutes");
const tempProductRoutes = require("./routes/tempProductRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
// MongoDB Connection
// In your main server file (e.g., server.js or app.js)


// connectDB();
// test

// Middleware to log requests
app.use((req, res, next) => {
  // console.log(`${req.method} request for '${req.url}'`);
  next();
});
app.use(
  cors({
    origin: "*", // Allowed origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    // allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
// startAgenda().catch((err) => {
//   console.error("Agenda failed to start", err);
// });

require("./utils/scheduler"); // This will start the cron job

// Middleware to parse JSON body data
app.use(express.json());

// Apply checkApiKey middleware for all routes (or you can apply it selectively)
app.use(checkApiKey);
//
// Use user routes
app.use("/users", userRoutes);
app.use("/product", productRoutes);
app.use("/brand", brandRoutes);
app.use("/category", categoryRoutes);
app.use("/subcategory", subcategoryRoutes);
app.use("/warehouse", warehouseRoutes);
app.use("/auth", authRoutes);
app.use("/search", searchRoutes);
app.use("/searchhistory", searchHistoryRoutes);
app.use("/jobs", jobRoutes);

app.use("/ui", homeUiRoutes);
app.use("/categoryui", categoryUiRoutes);
app.use("/banner", bannerRoutes);
app.use("/coupon", couonRoutes);
app.use("/order", orderRoutes);
app.use("/superSaver", superSaverUiRoutes);
app.use("/applicationManagement", applicationManagementRoutes);
app.use("/complaint", complaintsRoutes);
app.use("/orderRoute", orderRouteRoutes);
app.use("/deliveryAssignment", deliveryAssignmentRoutes);
app.use("/tempProduct", tempProductRoutes);
app.use("/api/v1/notifications", require("./routes/notificationRoutes"));
app.use("/payment", paymentRoutes);
const PORT = 3000;

connectDB()
  .then(() => {
    console.log("Connected to MongoDB");

    // Start the Server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  });

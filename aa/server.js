const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require('morgan');
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ✅ Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from frontend
    credentials: true, // Allow cookies and authentication headers
  })
);
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve images from 'uploads' folder
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(express.json())
// ✅ MongoDB Connection
const MONGO_URI = "mongodb://127.0.0.1:27017/foodcart"; // Update with your DB name

mongoose
  .connect(MONGO_URI) // ✅ Removed deprecated options
  .then(() => {
    console.log("✅ MongoDB Connected");

    // ✅ Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/restaurants", restaurantRoutes);
    app.use("/api/admin",adminRoutes);
    app.use("/api/orders", orderRoutes);

    // ✅ Start Server
    const PORT = 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  });




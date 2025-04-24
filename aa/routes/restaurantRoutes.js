const express = require("express");
const multer = require("multer");
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Multer Setup for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Serve Uploaded Images
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Register a New Restaurant (With Image Upload)
router.post("/register", upload.single("restaurantImage"), async (req, res) => {
  try {
    // Destructure `email` from request body
    const { user, restaurantName, sector, locality, building, floor, foodType, email } = req.body;

    console.log("Request Payload:", req.body); // Log the request payload

    // Check if required fields are missing
    if (!user || !restaurantName || !sector || !locality || !building || !floor || !foodType || !email) {
      return res.status(400).json({ message: "All fields are required, including email" });
    }

    // Create a new restaurant
    const newRestaurant = new Restaurant({
      user,
      restaurantName,
      sector,
      locality,
      building,
      floor,
      foodType,
      email, // Ensure email is included
      restaurantImage: req.file ? req.file.filename : null, // Save uploaded image
    });

    const savedRestaurant = await newRestaurant.save(); // Save the restaurant to the database

    res.status(201).json({
      message: "Restaurant registered successfully!",
      restaurantId: savedRestaurant._id,
    });
  } catch (error) {
    console.error("Error registering restaurant:", error); // Log the error
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get All Restaurants (With Image URLs)
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.status(200).json(
      restaurants.map((restaurant) => ({
        ...restaurant._doc,
        restaurantImage: restaurant.restaurantImage
          ? `http://localhost:5000/uploads/${restaurant.restaurantImage}`
          : "http://localhost:3000/default-restaurant.png", // Provide a default image
      }))
    );
  } catch (error) {
    console.error("❌ Error fetching restaurants:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Add Dish to a Restaurant's Menu (With Image Upload)
router.post("/add-dish", upload.single("image"), async (req, res) => {
  try {
    const { restaurantId, dishName, description, price, category } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!restaurantId || !dishName || !description || !price || !category || !image) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found!" });
    }

    const newDish = { dishName, description, price, category, image };
    restaurant.menu.push(newDish);
    await restaurant.save();

    res.status(201).json({ message: "Dish added successfully!", dish: newDish });
  } catch (error) {
    console.error("Error adding dish:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// ✅ Get Menu for a Restaurant
router.get("/menu/:restaurantId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found!" });
    }

    // ✅ Group dishes by category
    const categorizedMenu = {};
    restaurant.menu.forEach((dish) => {
      if (!categorizedMenu[dish.category]) {
        categorizedMenu[dish.category] = [];
      }
      categorizedMenu[dish.category].push(dish);
    });

    res.status(200).json(categorizedMenu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// ✅ Get Restaurant ID (Modify as Needed)
router.get("/get-id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne(); // Modify as needed
    if (!restaurant) {
      return res.status(404).json({ message: "No restaurant found" });
    }
    res.status(200).json({ restaurantId: restaurant._id });
  } catch (error) {
    console.error("❌ Error fetching restaurant ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Document Upload Endpoint
router.post("/upload-docs", upload.array("documents", 5), async (req, res) => {
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No documents uploaded!" });
    }
    
    // Map files to their accessible URLs (adjust if you want to use a different path)
    const docs = req.files.map(file => ({
      filename: file.filename,
      url: `http://localhost:5000/uploads/${file.filename}`
    }));

    res.status(201).json({ 
      message: "Documents uploaded successfully!", 
      documents: docs 
    });
  } catch (error) {
    console.error("Error uploading documents:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// ✅ Get Menu for a Restaurant (Corrected)
router.get("/:id/menu", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json({ restaurantName: restaurant.restaurantName, menu: restaurant.menu || [] });
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Search restaurants by name, sector, or locality (Modify as needed)
    const restaurants = await Restaurant.find({
      $or: [
        { restaurantName: { $regex: query, $options: "i" } },
        { sector: { $regex: query, $options: "i" } },
        { locality: { $regex: query, $options: "i" } }
      ],
    });

    res.status(200).json(restaurants);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get Restaurant by User ID
router.get("/user/:userId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ user: req.params.userId });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get Orders for a Restaurant
router.get("/:id/orders", authMiddleware, async (req, res) => {
  try {
    const restaurantId = req.params.id;
    
    // Find all orders for this restaurant
    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

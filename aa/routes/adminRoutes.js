const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { authenticateAdmin } = require("../middleware/adminMiddleware"); 

router.get("/restaurants/pending", authenticateAdmin, async (req, res) => {
  try {
    const pendingRestaurants = await Restaurant.find({ isVerified: false })
      .populate('user', 'name phone email'); // Populate user information
    res.status(200).json(pendingRestaurants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Approve/Decline a restaurant (Admin Only)
router.put("/verify/:id", authenticateAdmin, async (req, res) => {
  try {
    const { isVerified } = req.body;

    if (typeof isVerified !== "boolean") {
      return res.status(400).json({ message: "Invalid verification status" });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.isVerified = isVerified;
    restaurant.status = isVerified ? "approved" : "rejected"; // Update status field
    await restaurant.save();

    res.status(200).json({
      message: `Restaurant ${isVerified ? "approved" : "declined"} successfully!`,
    });
  } catch (error) {
    console.error("Error verifying restaurant:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Approve a restaurant (Admin Only)
router.post("/restaurants/approve/:id", authenticateAdmin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    restaurant.status = "approved";
    restaurant.isVerified = true; // Ensure verification status updates
    await restaurant.save();
    res.json({ message: "Restaurant Approved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post("/restaurants/reject/:id", authenticateAdmin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Delete the restaurant from the database
    await Restaurant.findByIdAndDelete(req.params.id);

    res.json({ message: "Restaurant rejected and removed from database" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/restaurants/verified", authenticateAdmin, async (req, res) => {
  try {
    const verifiedRestaurants = await Restaurant.find({ isVerified: true })
      .populate('user', 'name phone email'); // Populate user information
    res.status(200).json(verifiedRestaurants);
  } catch (err) {
    res.status(500).json({ message: "Error fetching verified restaurants" });
  }
});

router.get("/users", authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 10; // Show 10 users per page
    const skip = (page - 1) * limit;

    const users = await User.find().skip(skip).limit(limit); // Fetch users with pagination
    const totalUsers = await User.countDocuments(); // Get total user count

    res.status(200).json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

router.delete("/restaurants/:id", authenticateAdmin, async (req, res) => {
  try {
    const restaurantId = req.params.id;
    await Restaurant.findByIdAndDelete(restaurantId);
    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete restaurant" });
  }
});
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;

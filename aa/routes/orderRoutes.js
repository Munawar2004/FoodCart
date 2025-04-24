const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { customerName, items, total, restaurantId } = req.body;
    
    // Validate required fields
    if (!customerName || !items || !total || !restaurantId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create new order
    const newOrder = new Order({
      customerName,
      items,
      total,
      restaurantId,
      status: "Pending",
      userId: req.user.id
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order" });
  }
});

// Get orders for a specific restaurant
router.get("/", authMiddleware, async (req, res) => {
  try {
    // First find the restaurant owned by this user
    const restaurant = await Restaurant.findOne({ user: req.user.id });
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found for this user" });
    }

    // Then find all orders for this restaurant
    const orders = await Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Get order history (shipped and declined orders)
router.get("/history", authMiddleware, async (req, res) => {
  try {
    // First find the restaurant owned by this user
    const restaurant = await Restaurant.findOne({ user: req.user.id });
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found for this user" });
    }

    // Find orders with "Shipped" or "Declined" status and populate user information
    const history = await Order.find({
      restaurantId: restaurant._id,
      status: { $in: ["Shipped", "Declined"] }
    })
    .populate('userId', 'name phone') // Populate user information
    .sort({ createdAt: -1 });
    
    // Transform the data to include phone number directly in the order object
    const transformedHistory = history.map(order => {
      const orderObj = order.toObject();
      orderObj.phoneNumber = orderObj.userId?.phone || "N/A";
      return orderObj;
    });
    
    res.json(transformedHistory);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ message: "Error fetching order history" });
  }
});

// Update order status
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// Get a specific order by ID (for users to check their order status)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if the user is the one who placed the order
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Error fetching order" });
  }
});

module.exports = router;

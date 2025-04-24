const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const router = express.Router();
const cookieParser = require("cookie-parser");


router.use(cookieParser()); // ✅ Enables reading cookies

// ✅ Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log("Received Auth Header:", authHeader); // Debugging

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "⚠️ Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token
    console.log("Extracted Token:", token); // Debugging

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Debugging

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "⚠️ Unauthorized: Invalid token" });
  }
};

module.exports = authenticateToken;

router.get("/api/auth/user", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


// ✅ Check if Email Exists
router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  try {
    const userExists = await User.findOne({ email });
    const restaurantExists = await Restaurant.findOne({ email });

    res.status(200).json({
      exists: !!userExists || !!restaurantExists,
      message: userExists || restaurantExists ? "⚠️ Email is already in use" : "✅ Email is available",
    });
  } catch (error) {
    console.error("❌ Error checking email:", error);
    res.status(500).json({ message: "🚨 Server error" });
  }
});

// ✅ Register User (WITHOUT HASHING)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, dob, role } = req.body;

    console.log("Request Payload:", req.body); // Log the request payload

    // Check if required fields are missing
    if (!name || !email || !password || !phone || !dob || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create a new user
    const newUser = new User({
      name,
      email,
      password, // Store password in plain text (not recommended)
      phone,
      dob: new Date(dob), // Convert dob string to a Date object
      role,
    });

    const savedUser = await newUser.save(); // Save the user to the database

    res.status(201).json({
      message: "User registered successfully!",
      userId: savedUser._id,
    });
  } catch (error) {
    console.error("Error registering user:", error); // Log the error
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/user", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ userId: req.session.user.id, email: req.session.user.email });
});
// ✅ Register Restaurant (WITHOUT HASHING)
router.post("/register", authenticateToken, async (req, res) => {
  try {
    const { restaurantName, sector, locality, building, floor, foodType } = req.body;
    const user = await User.findById(req.user.id);  // ✅ Find user by token

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const restaurant = new Restaurant({
      user: user._id,
      email: user.email,  // ✅ Extract email from user
      restaurantName,
      sector,
      locality,
      building,
      floor,
      foodType,
    });

    await restaurant.save();
    res.status(201).json({ message: "Restaurant registered successfully", restaurant });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Login User or Restaurant (WITHOUT HASHING)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in either User or Restaurant collection
    const user = await User.findOne({ email }) || await Restaurant.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if the user is a restaurant and ensure it is verified before login
    if (user.role === "restaurant" && !user.isVerified) {
      return res.status(403).json({ message: "Your restaurant is pending approval. You cannot log in until it is verified by the admin." });
    }

    // Check password (replace with bcrypt compare if password hashing is used)
    const isMatch = password === user.password; 
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Define userType (defaulting to "restaurant" if role is missing)
    const userType = user.role || "restaurant";

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Store token in an HTTP-only cookie
    res.cookie("token", token, { httpOnly: true, sameSite: "strict", secure: false });

    // ✅ Return token in response
    res.json({ message: "Login successful", user_name: user.name, userType, token });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Logout User (Clears JWT Cookie)
router.post("/logout", (req, res) => {
  res.clearCookie("token"); // ✅ Remove token from cookies
  res.json({ message: "🚪 Logged out successfully" });
});

// ✅ Get Logged-In User Details (Requires Auth)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    console.log("Decoded user from token:", req.user); // Debugging

    const { id, userType } = req.user;
    let account;

    // First try to find the user in the User collection
    account = await User.findById(id);
    
    // If not found and userType is restaurant_owner, try Restaurant collection
    if (!account && userType === "restaurant_owner") {
      account = await Restaurant.findOne({ user: id });
    }

    console.log("Found Account:", account); // Debugging

    if (!account) {
      return res.status(404).json({ message: "⚠️ User not found" });
    }

    res.json({
      id: account._id,
      name: account.name || account.restaurantName,
      email: account.email,
      phone: account.phone,
      userType: userType || (account.role === "restaurant" ? "restaurant_owner" : "user"),
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "🚨 Server error" });
  }
});

module.exports = router;

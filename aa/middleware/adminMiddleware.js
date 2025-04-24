const User = require("../models/User");
const jwt = require("jsonwebtoken");


// Middleware to authenticate admin

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log("Received Auth Header:", authHeader); // ✅ Debugging step
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access Denied: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract token

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded Token:", decoded); // ✅ Check token data

    if (!decoded || decoded.userType !== "admin") {
      return res.status(403).json({ message: "Access Denied: Not an admin" });
    }

    req.admin = decoded; // Store admin data in request
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }

    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
};


// Middleware to authenticate regular users
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token; // Read token from cookies

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

module.exports = { authenticateAdmin, authenticateToken };

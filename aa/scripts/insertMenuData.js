require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");

// ✅ MongoDB Connection
const MONGO_URI = " mongodb://127.0.0.1:27017/foodcart/newdata"; // Use your actual DB name

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Fetch & Insert Menu Data
const fetchAndInsertMenu = async () => {
  try {
    console.log("📡 Fetching menu data...");
    const response = await axios.get("https://foodbukka.herokuapp.com/api/v1/menu");
    const menuItems = response.data.Result;

    if (!Array.isArray(menuItems)) {
      throw new Error("Invalid API Response: Expected an array");
    }

    // ✅ Group menu items by restaurantId
    const menuByRestaurant = {};
    menuItems.forEach((item) => {
      if (!menuByRestaurant[item.restaurantId]) {
        menuByRestaurant[item.restaurantId] = [];
      }
      menuByRestaurant[item.restaurantId].push({
        name: item.menu_name,
        description: item.description || "No description",
        price: item.price || 0,
        image: item.image || "",
      });
    });

    // ✅ Update or Insert Restaurants with Menus
    for (const [restaurantId, menu] of Object.entries(menuByRestaurant)) {
      await Restaurant.findOneAndUpdate(
        { _id: restaurantId }, // Assuming restaurantId is the MongoDB `_id`
        { $set: { menu } },
        { upsert: true, new: true }
      );
    }

    console.log("✅ Restaurant Menu Data Inserted Successfully!");
  } catch (error) {
    console.error("❌ Error inserting menu data:", error);
  } finally {
    mongoose.connection.close();
  }
};

// ✅ Run Script
fetchAndInsertMenu();

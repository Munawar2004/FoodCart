/* const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("❌ MongoDB URI is missing from environment variables");
    }

    await mongoose.connect(mongoUri); // Remove deprecated options

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  } 
};

module.exports = connectDB;
 */
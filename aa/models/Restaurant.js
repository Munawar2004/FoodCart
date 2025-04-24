const mongoose = require("mongoose");

const DishSchema = new mongoose.Schema({
  dishName: String,
  description: String,
  price: Number,
  category:{ type: String, required: true },
  image: String,
 
});

const RestaurantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  restaurantName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  sector: String,
  locality: String,
  building: String,
  floor: String,
  foodType: String,
  restaurantImage: String,
  menu: [DishSchema], 
  isVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model("Restaurant", RestaurantSchema);
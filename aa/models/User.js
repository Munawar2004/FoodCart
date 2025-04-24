const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dob: { type: Date, required: true }, // ✅ Add DOB
  phone: { type: String, required: true }, // ✅ Add Phone
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "restaurant_owner", "admin"], required: true }, 
});

module.exports = mongoose.model("User", UserSchema);


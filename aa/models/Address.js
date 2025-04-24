const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    landmark: {
      type: String,
      default: "",
    },
    floor: {
      type: String,
      default: "",
    },
    shopNumber: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);

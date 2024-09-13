const mongoose = require("mongoose");
const ServiceCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  videoUrl: { type: String },
  imageUrl: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const ServiceCategory = mongoose.model(
  "ServiceCategory",
  ServiceCategorySchema 
);
module.exports = ServiceCategory;

const mongoose = require("mongoose");
const objectID = mongoose.Schema.Types.ObjectId;
 
const ServiceTypeSchema = new mongoose.Schema({
  serviceCategory: {
    type: objectID,
    required: true,
    ref: "ServiceCategory",
  },
  name: { type: String, required: true },
  rate: { type: Number, required: true },
  description: { type: String },
  videoUrl: { type: String },
  imageUrl: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ServiceType = mongoose.model("ServiceType", ServiceTypeSchema);

module.exports = ServiceType;

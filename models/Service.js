const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  serviceCategory: {
    type: Schema.Types.ObjectId,
    ref: "ServiceCategory",
    required: true,
  },
  serviceType: {
    type: Schema.Types.ObjectId,
    ref: "ServiceType",
    required: true,
  },
  technician: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: Date,
    required: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  serviceDescription: {
    type: String,
    required: true,
  },
  servicePicture: {
    type: String,
    required: true,
  },
  serviceRate: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
  },
  paymentId: {
    type: String,
  },
  reason: {
    type: String,
  },
  additionalCharges: {
    type: Number,
    default: 0,
  },
  feedback: {
    type: Schema.Types.ObjectId,
    ref: "Feedback",
  },
  report: {
    type: Schema.Types.ObjectId,
    ref: "Report",
  },
  chats: [{ type: Schema.Types.ObjectId, ref: "Chat" }],
  notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
  isPayTechnician: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;

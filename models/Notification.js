const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ['service_accepted', 'new_chat_message', 'technician_authorized', 'new_service_request'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: "Service",
  },
  relatedChat: {
    type: Schema.Types.ObjectId,
    ref: "Chat",
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
const Chat = require("../models/Chat");
const Service = require("../models/Service");
const Notification = require("../models/Notification");
const cloudinary = require("../utils/cloudinary.js");

const getChatHistory = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const chatHistory = await Chat.find({ service: serviceId })
      .sort({ timestamp: 1 })
      .populate("sender", "firstName lastName role");
    res.status(200).json(chatHistory);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching chat history", error: error.message });
  }
};
  
const sendMessage = async (req, res) => {
  try {
    const { serviceId, message, type , file} = req.body;

    if (!serviceId || !type) {
      return res
        .status(400)
        .json({ message: "serviceId and type are required" });
    }

    let newMessage = new Chat({
      service: serviceId,
      sender: req.user._id,
      type: type,
    });

    if (type === "text") {
      if (!message) {
        return res
          .status(400)
          .json({ message: "message is required for text type" });
      }
      newMessage.message = message;
    } else if (type === "audio" || type === "image" || type === "video") {
      if (!file) {
        return res
          .status(400)
          .json({
            message: "File is required for audio, image, or video type",
          });
      }
      const uploadResult = await cloudinary.uploader.upload(file, {
        resource_type: type,
        folder: `techcare/chat_${type}s`,
      });
      newMessage[`${type}Url`] = uploadResult.secure_url;
    }

    await newMessage.save();

    const service = await Service.findByIdAndUpdate(serviceId, {
      $push: { chats: newMessage._id },
    });
    await newMessage.populate("sender", "firstName lastName role");

    const recipientId =
      req.user.role === "technician" ? service.user : service.technician;

    const notification = new Notification({
      recipient: recipientId,
      sender: req.user._id,
      type: "new_chat_message",
      content: `New ${type} message from ${req.user.firstName} ${req.user.lastName}`,
      serviceId: serviceId,
      relatedChat: newMessage._id,
    });
    await notification.save();

    req.app
      .get("io")
      .to(serviceId)
      .emit("chat message",  newMessage);

      // if (req.app.get("onlineUsers").has(recipientId.toString())) {
      //   req.app
      //     .get("io")
      //     .to(newMessage.sender.toString())
      //     .emit("message read", newMessage._id);
      // }

    req.app
      .get("io")
      .to(recipientId.toString())
      .emit("new notification", notification);

    res.status(201).json(newMessage);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("sender", "firstName lastName");

    res.status(200).json(notifications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error clearing notifications", error: error.message });
  }
};

const removeNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing notification", error: error.message });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { serviceId, messageIds } = req.body;
  
    await Chat.updateMany(
      { _id: { $in: messageIds }, service: serviceId, sender: { $ne: req.user._id } },
      { $set: { read: true } }
    );
 
    const io = req.app.get("io");
    messageIds.forEach((messageId) => {
      io.to(serviceId).emit("message read", messageId);
    });

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Error marking messages as read", error: error.message });
  }
};

module.exports = {
  getChatHistory,
  sendMessage,
  getNotifications,
  markNotificationAsRead,
  clearAllNotifications,
  removeNotification,
  markMessagesAsRead,
};

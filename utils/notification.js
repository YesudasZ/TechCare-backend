const Notification = require('../models/Notification');

const createNotification = async (recipientId, senderId, type, content, serviceId, relatedChat) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      content,
      serviceId,
      relatedChat
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const getUnreadNotifications = async (userId) => {
  try {
    return await Notification.find({ recipient: userId, read: false })
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName')
      .populate('serviceId', 'serviceName');
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw error;
  }
};

module.exports = { createNotification, getUnreadNotifications };
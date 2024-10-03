const socketHandler = (io) => {
  const onlineUsers = new Set();

    io.on("connection", (socket) => {
      console.log("New client connected");
  
      socket.on("join room", (roomId) => {
        socket.join(roomId);
        console.log(`Client joined room: ${roomId}`);
      });

      socket.on("join user room", (userId) => {
        socket.join(userId);
        console.log(`Client joined user room: ${userId}`);
      });
  
      socket.on("leave room", (roomId) => {
        socket.leave(roomId);
        console.log(`Client left room: ${roomId}`);
      });

      socket.on("user online", (userId) => {
        onlineUsers.add(userId);
        io.emit("user online", userId);
      });
  
      socket.on("user offline", (userId) => {
        onlineUsers.delete(userId);
        io.emit("user offline", userId);
      });

      socket.on("chat message", async (data) => {
        try {
          const { roomId, message, senderId } = data;
          console.log(`Received message in room ${roomId} from ${senderId}: ${message}`);
          io.to(roomId).emit("chat message", {
            sender: { _id: senderId },
            message: message,
            timestamp: new Date(),
            _id: data._id,  
          });
        } catch (error) {
          console.error("Error saving and emitting message:", error);
        }
      });

      socket.on("check message read", async (messageId) => {
        const message = await Chat.findById(messageId);
        if (message && onlineUsers.has(message.service.toString())) {
          io.to(message.sender.toString()).emit("message read", messageId);
        }
      });
  
      socket.on("disconnect", () => {
        console.log("Client disconnected");
      });
    });
  };
  
  module.exports = socketHandler;
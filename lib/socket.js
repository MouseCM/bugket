/* lib/socket.js — Socket.IO Real-time Logic */
const { verifyToken } = require("./jwt");
const prisma = require("./prisma");

module.exports = function (io) {
  // Middleware for Socket.IO Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error("Chưa phân quyền."));

    try {
      const user = verifyToken(token);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Token không hợp lệ."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User connected: ${userId} (${socket.user.name})`);

    // 1. Join personal room to receive personal notifications (e.g., friend requests)
    socket.join(`user:${userId}`);

    // 2. Join conversation rooms
    socket.on("join_conversation", async (conversationId) => {
      try {
        // Verify user is participant
        const isParticipant = await prisma.participant.findUnique({
          where: { userId_conversationId: { userId, conversationId } }
        });
        
        if (isParticipant) {
          socket.join(`conv:${conversationId}`);
          console.log(`[Socket] User ${userId} joined conv:${conversationId}`);
        }
      } catch (err) {
        console.error("Error joining conversation:", err);
      }
    });

    // 3. Handle sending messages
    socket.on("send_message", async (data, callback) => {
      const { conversationId, content } = data;
      if (!conversationId || !content || !content.trim()) return;

      try {
        // Verify participant
        const isParticipant = await prisma.participant.findUnique({
          where: { userId_conversationId: { userId, conversationId } }
        });

        if (!isParticipant) return;

        // Save message to DB
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: content.trim()
          },
          include: {
            sender: { select: { id: true, name: true } }
          }
        });

        // Broadcast to everyone in the room (including sender)
        io.to(`conv:${conversationId}`).emit("new_message", message);

        if (callback) callback({ status: "ok" });
      } catch (err) {
        console.error("Error sending message:", err);
        if (callback) callback({ status: "error", message: "Không thể gửi tin nhắn." });
      }
    });

    // 4. Typing indicator
    socket.on("typing", (conversationId) => {
      socket.to(`conv:${conversationId}`).emit("typing", {
        conversationId,
        userId,
        name: socket.user.name
      });
    });

    // 5. Read receipt (Optional functionality)
    socket.on("mark_read", async (conversationId) => {
      try {
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: userId },
            read: false
          },
          data: { read: true }
        });
        socket.to(`conv:${conversationId}`).emit("messages_read", { conversationId, userId });
      } catch (err) {
        console.error("Error marking messages read:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });
};

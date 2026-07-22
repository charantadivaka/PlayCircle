const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * Initialize all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 * @param {Map<string, string>} onlineUsers  userId → socketId
 */
const initSocketHandler = (io, onlineUsers) => {
  // --- Authentication middleware for socket connections ---
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = String(socket.user._id);
    console.log(`🟢 User connected: ${socket.user.name} (${userId})`);

    // --- Mark user online ---
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date(),
    });

    // Broadcast to everyone that this user is now online
    socket.broadcast.emit('user:online', { userId });

    // --- Join personal room so we can send targeted events ---
    socket.join(userId);

    // ─────────────────────────────────────────────
    // LOCATION UPDATE
    // ─────────────────────────────────────────────
    socket.on('location:update', async ({ lng, lat }) => {
      try {
        await User.findByIdAndUpdate(userId, {
          location: { type: 'Point', coordinates: [lng, lat] },
        });
      } catch (err) {
        console.error('location:update error', err.message);
      }
    });

    // ─────────────────────────────────────────────
    // CHAT — MESSAGE SEND
    // ─────────────────────────────────────────────
    socket.on('message:send', async ({ conversationId, text }, ack) => {
      try {
        if (!text || !text.trim()) return;

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });
        if (!conversation) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          text: text.trim(),
        });
        await message.populate('sender', 'name avatar');

        // Update conversation meta
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        // Emit to all participants in the conversation
        const participants = conversation.participants.map(String);
        participants.forEach((pid) => {
          io.to(pid).emit('message:receive', { message, conversationId });
        });

        // Acknowledge back to sender
        if (typeof ack === 'function') ack({ success: true, message });
      } catch (err) {
        console.error('message:send error', err.message);
        if (typeof ack === 'function') ack({ success: false, error: err.message });
      }
    });

    // ─────────────────────────────────────────────
    // TYPING INDICATORS
    // ─────────────────────────────────────────────
    socket.on('typing:start', ({ conversationId, recipientId }) => {
      io.to(recipientId).emit('typing:start', { conversationId, userId });
    });

    socket.on('typing:stop', ({ conversationId, recipientId }) => {
      io.to(recipientId).emit('typing:stop', { conversationId, userId });
    });

    // ─────────────────────────────────────────────
    // DISCONNECT — mark user offline
    // ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        socketId: null,
        lastSeen: new Date(),
      });

      socket.broadcast.emit('user:offline', { userId, lastSeen: new Date() });
    });
  });
};

module.exports = initSocketHandler;

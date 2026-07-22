const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// GET /api/chat/conversations  — list all conversations for the current user
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name avatar isOnline lastSeen')
      .populate('lastMessage', 'text sender createdAt')
      .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/:convId/messages  — paginated message history
const getMessages = async (req, res, next) => {
  try {
    const { convId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Ensure user is a participant
    const conversation = await Conversation.findOne({
      _id: convId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: convId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    // Mark unread messages as read
    await Message.updateMany(
      { conversation: convId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    res.json({ messages });
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/:convId/messages  — send a message via REST (fallback for Socket.IO)
const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.convId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: text.trim(),
    });

    await message.populate('sender', 'name avatar');

    // Update conversation's lastMessage pointer
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

module.exports = { getConversations, getMessages, sendMessage };

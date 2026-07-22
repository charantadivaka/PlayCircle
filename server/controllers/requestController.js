const PlayRequest = require('../models/PlayRequest');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// POST /api/requests  — send a play request
const sendRequest = async (req, res, next) => {
  try {
    const { to, sport, message } = req.body;

    if (!to || !sport) {
      return res.status(400).json({ message: 'Recipient (to) and sport are required' });
    }

    // Prevent sending request to self
    if (String(to) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot send a request to yourself' });
    }

    // Check recipient exists
    const recipient = await User.findById(to);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    // Check for existing pending request
    const existing = await PlayRequest.findOne({
      from: req.user._id,
      to,
      sport,
      status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have a pending request to this player for this sport' });
    }

    const playRequest = await PlayRequest.create({
      from: req.user._id,
      to,
      sport,
      message: message || '',
    });

    await playRequest.populate('from', 'name avatar sports skillLevel');

    // Emit real-time notification via Socket.IO (if recipient is online)
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers'); // Map: userId → socketId
    const recipientSocketId = onlineUsers.get(String(to));
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('request:new', { playRequest });
    }

    res.status(201).json({ playRequest });
  } catch (err) {
    next(err);
  }
};

// GET /api/requests  — list incoming + outgoing requests for current user
const listRequests = async (req, res, next) => {
  try {
    const incoming = await PlayRequest.find({ to: req.user._id })
      .populate('from', 'name avatar sports skillLevel isOnline')
      .sort({ createdAt: -1 });

    const outgoing = await PlayRequest.find({ from: req.user._id })
      .populate('to', 'name avatar sports skillLevel isOnline')
      .sort({ createdAt: -1 });

    res.json({ incoming, outgoing });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/requests/:id  — accept or decline
const respondToRequest = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "accepted" or "declined"' });
    }

    const playRequest = await PlayRequest.findOne({
      _id: req.params.id,
      to: req.user._id, // only the recipient can respond
      status: 'pending',
    });

    if (!playRequest) {
      return res.status(404).json({ message: 'Request not found or already responded' });
    }

    playRequest.status = status;
    await playRequest.save();
    await playRequest.populate('from', 'name avatar');
    await playRequest.populate('to', 'name avatar');

    let conversation = null;

    // If accepted, ensure a conversation exists between the two users
    if (status === 'accepted') {
      const participants = [playRequest.from._id.toString(), playRequest.to._id.toString()].sort();
      conversation = await Conversation.findOneAndUpdate(
        { participants: { $all: participants } },
        { participants },
        { upsert: true, new: true }
      );
    }

    // Notify the sender in real time
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const senderSocketId = onlineUsers.get(String(playRequest.from._id));
    if (senderSocketId) {
      io.to(senderSocketId).emit('request:response', { playRequest, conversation });
    }

    res.json({ playRequest, conversation });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendRequest, listRequests, respondToRequest };

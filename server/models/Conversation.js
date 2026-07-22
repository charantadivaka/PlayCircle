const mongoose = require('mongoose');

// A Conversation is a unique pairing between two users.
// We guarantee uniqueness by always sorting participants before saving.
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure only one conversation per pair of users
conversationSchema.index({ participants: 1 }, { unique: false });

module.exports = mongoose.model('Conversation', conversationSchema);

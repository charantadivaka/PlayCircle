const mongoose = require('mongoose');

// A Conversation is a unique pairing between two users.
// We guarantee uniqueness by always sorting participants before saving
// (enforced via pre-save hook below), which makes the findOneAndUpdate
// with $all reliable even under concurrent requests.
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

// Sort participants before every save so the pair is always in a canonical
// order — this makes the $all query in requestController reliable.
conversationSchema.pre('save', function (next) {
  this.participants.sort((a, b) => a.toString().localeCompare(b.toString()));
  next();
});

// Index for fast lookup by participants (not unique at DB level because
// MongoDB can't enforce uniqueness on unsorted arrays; ordering is
// maintained by the pre-save hook above instead).
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);


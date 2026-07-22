const mongoose = require('mongoose');

const playRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sport: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      maxlength: 300,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending requests between the same pair of users for the same sport
playRequestSchema.index({ from: 1, to: 1, sport: 1, status: 1 });

module.exports = mongoose.model('PlayRequest', playRequestSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never return in queries by default
    },
    avatar: {
      type: String,
      default: null, // filename stored in /uploads
    },
    age: {
      type: Number,
      min: 10,
      max: 100,
    },
    bio: {
      type: String,
      maxlength: 200,
      default: '',
    },
    sports: {
      type: [String],
      enum: [
        'Cricket',
        'Football',
        'Badminton',
        'Volleyball',
        'Basketball',
        'Tennis',
        'Chess',
        'Table Tennis',
        'Running',
        'Cycling',
      ],
      default: [],
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

// 2dsphere index — required for $geoNear / $near queries
userSchema.index({ location: '2dsphere' });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare plain password to stored hash
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.socketId;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

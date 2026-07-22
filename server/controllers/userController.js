const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// GET /api/users/nearby?sport=Cricket&radius=10&lng=80.2707&lat=13.0827
const getNearbyPlayers = async (req, res, next) => {
  try {
    const { sport, radius = 10, lng, lat } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ message: 'lng and lat query params are required' });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    const radiusInMeters = parseFloat(radius) * 1000; // km → metres

    const query = {
      _id: { $ne: req.user._id }, // exclude self
      isOnline: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [longitude, latitude] },
          $maxDistance: radiusInMeters,
        },
      },
    };

    if (sport && sport !== 'All') {
      query.sports = sport;
    }

    const players = await User.find(query).select(
      'name avatar age sports skillLevel location isOnline lastSeen'
    );

    res.json({ players });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/location  (protected)
const updateLocation = async (req, res, next) => {
  try {
    const { lng, lat } = req.body;
    if (lng === undefined || lat === undefined) {
      return res.status(400).json({ message: 'lng and lat are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
      },
      { new: true }
    );

    res.json({ location: user.location });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id  (protected)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-passwordHash -socketId -__v'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/profile  (protected, optional avatar upload)
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, age, bio, sports, skillLevel } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (age) updates.age = age;
    if (bio !== undefined) updates.bio = bio;
    if (sports) updates.sports = Array.isArray(sports) ? sports : JSON.parse(sports);
    if (skillLevel) updates.skillLevel = skillLevel;

    // If a new avatar was uploaded, delete the old one
    if (req.file) {
      if (req.user.avatar) {
        const oldPath = path.join(__dirname, '..', 'uploads', req.user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.avatar = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNearbyPlayers, updateLocation, getUserById, updateProfile };

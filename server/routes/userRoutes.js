const router = require('express').Router();
const { body } = require('express-validator');
const {
  getNearbyPlayers,
  updateLocation,
  getUserById,
  updateProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// All user routes are protected
router.use(protect);

router.get('/nearby', getNearbyPlayers);
router.patch('/location', updateLocation);

router.get('/:id', getUserById);
router.patch(
  '/profile',
  upload.single('avatar'),
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name too short'),
    body('age').optional().isInt({ min: 10, max: 100 }).withMessage('Age must be 10–100'),
  ],
  updateProfile
);

module.exports = router;

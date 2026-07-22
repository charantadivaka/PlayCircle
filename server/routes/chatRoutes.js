const router = require('express').Router();
const { getConversations, getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:convId/messages', getMessages);
router.post('/:convId/messages', sendMessage);

module.exports = router;

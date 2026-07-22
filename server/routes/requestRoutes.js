const router = require('express').Router();
const { sendRequest, listRequests, respondToRequest } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').post(sendRequest).get(listRequests);
router.patch('/:id', respondToRequest);

module.exports = router;

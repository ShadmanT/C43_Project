const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

router.get('/requests', friendController.getAllRequests);
router.post('/request', friendController.sendFriendRequest);
router.post('/respond', friendController.respondToRequest);
router.get('/', friendController.getAllFriends);
router.get('/pending', friendController.getPendingRequests);
router.delete('/:friendId', friendController.deleteFriend);

module.exports = router;

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.post('/', reviewController.createOrUpdateReview);
router.get('/:listId', reviewController.getReviewsForList);
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;

const pool = require('../db');

exports.createOrUpdateReview = async (req, res) => {
  const userId = parseInt(req.headers['x-user-id']) || 1;
  const { listId, content } = req.body;

  if (!listId || !content) {
    return res.status(400).json({ error: 'listId and content are required' });
  }

  try {
    await pool.query(
      `INSERT INTO Review (list_id, user_id, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (list_id, user_id)
       DO UPDATE SET content = $3, last_edit = CURRENT_TIMESTAMP`,
      [listId, userId, content]
    );

    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    console.error('Review submission failed:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

exports.getReviewsForList = async (req, res) => {
  const userId = parseInt(req.headers['x-user-id']) || 1;
  const listId = parseInt(req.params.listId);

  try {
    const listRes = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1`,
      [listId]
    );

    if (listRes.rows.length === 0) {
      return res.status(404).json({ error: 'Stock list not found' });
    }

    const list = listRes.rows[0];

    if (list.visibility === 'private' && list.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view reviews on private list' });
    }

    if (list.visibility === 'shared') {
      const sharedWithRes = await pool.query(
        `SELECT * FROM StockListShare WHERE list_id = $1 AND shared_with = $2`,
        [listId, userId]
      );

      if (list.user_id !== userId && sharedWithRes.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized to view reviews on shared list' });
      }
    }

    const reviews = await pool.query(
      `SELECT r.review_id, r.user_id, r.content, r.last_edit, u.username
       FROM Review r
       JOIN UserAccount u ON u.user_id = r.user_id
       WHERE r.list_id = $1`,
      [listId]
    );

    res.json(reviews.rows);
  } catch (err) {
    console.error('Fetch reviews failed:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.deleteReview = async (req, res) => {
  const userId = parseInt(req.headers['x-user-id']) || 1;
  const reviewId = parseInt(req.params.reviewId);

  try {
    const result = await pool.query(
      `DELETE FROM Review WHERE review_id = $1 AND user_id = $2`,
      [reviewId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('Delete review failed:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

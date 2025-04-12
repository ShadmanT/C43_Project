const pool = require('../db/db');
const getUserId = (req) => parseInt(req.headers['x-user-id']) || 1; // simulate auth

exports.sendFriendRequest = async (req, res) => {
  const senderId = getUserId(req);
  const { receiverId } = req.body;
  try {
    const existing = await pool.query(`
      SELECT * FROM FriendRequest
      WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'
    `, [senderId, receiverId]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Request already pending' });
    }

    await pool.query(
      `INSERT INTO FriendRequest (sender_id, receiver_id) VALUES ($1, $2)`,
      [senderId, receiverId]
    );
    res.status(201).json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  const userId = getUserId(req);
  try {
    const incoming = await pool.query(`SELECT * FROM FriendRequest WHERE receiver_id = $1`, [userId]);
    const outgoing = await pool.query(`SELECT * FROM FriendRequest WHERE sender_id = $1`, [userId]);
    res.json({ incoming: incoming.rows, outgoing: outgoing.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  const userId = getUserId(req);
  try {
    const result = await pool.query(
      `SELECT * FROM FriendRequest WHERE receiver_id = $1 AND status = 'pending'`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.respondToRequest = async (req, res) => {
  const userId = getUserId(req);
  const { requestId, action } = req.body;
  try {
    const reqResult = await pool.query(`SELECT * FROM FriendRequest WHERE request_id = $1`, [requestId]);
    const request = reqResult.rows[0];

    if (!request || request.receiver_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query(`UPDATE FriendRequest SET status = $1 WHERE request_id = $2`, [action, requestId]);

    if (action === 'accept') {
      await pool.query(`
        INSERT INTO FriendsWith (user_id1, user_id2) VALUES ($1, $2), ($2, $1)
      `, [request.sender_id, request.receiver_id]);
    }
    res.status(200).json({ message: 'Responded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFriends = async (req, res) => {
  const userId = getUserId(req);
  try {
    const result = await pool.query(`
      SELECT u.user_id, u.username FROM FriendsWith f
      JOIN UserAccount u ON u.user_id = f.user_id2
      WHERE f.user_id1 = $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFriend = async (req, res) => {
  const userId = getUserId(req);
  const friendId = req.params.friendId;
  try {
    await pool.query(`
      DELETE FROM FriendsWith
      WHERE (user_id1 = $1 AND user_id2 = $2)
            OR (user_id1 = $2 AND user_id2 = $1)
    `, [userId, friendId]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

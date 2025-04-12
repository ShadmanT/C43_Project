// controllers/stockListController.js
const pool = require('../db/db');

// TEMP: simulate user auth middleware
const getUserId = (req) => parseInt(req.headers['x-user-id']) || 1;
 // replace with req.user.id when auth is ready

 exports.getAllStockLists = async (req, res) => {
  const userId = getUserId(req);

  try {
    const { rows } = await pool.query(`
      (
        SELECT sl.*, sli.symbol, sli.num_shares, NULL AS shared_by
        FROM StockList sl
        LEFT JOIN StockListItem sli ON sl.list_id = sli.list_id
        WHERE sl.user_id = $1
      )
      UNION ALL
      (
        SELECT sl.*, sli.symbol, sli.num_shares, ua.username AS shared_by
        FROM StockListShare s
        JOIN StockList sl ON s.list_id = sl.list_id
        LEFT JOIN StockListItem sli ON sl.list_id = sli.list_id
        JOIN UserAccount ua ON sl.user_id = ua.user_id
        WHERE s.shared_with = $1
      )
    `, [userId]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getSharedStockLists = async (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  try {
    const result = await pool.query(`
      SELECT sl.*, sli.symbol, sli.num_shares, ua.username AS shared_by
      FROM StockListShare s
      JOIN StockList sl ON s.list_id = sl.list_id
      LEFT JOIN StockListItem sli ON sl.list_id = sli.list_id
      JOIN UserAccount ua ON sl.user_id = ua.user_id
      WHERE s.shared_with = $1
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch shared lists:', err);
    res.status(500).json({ error: 'Could not retrieve shared lists' });
  }
};


exports.getStockListById = async (req, res) => {
  const listId = parseInt(req.params.listId);

  try {
    const result = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1`,
      [listId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock list not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Fetch list by ID failed:', err);
    res.status(500).json({ error: 'Failed to fetch stock list' });
  }
};

exports.getStockListItems = async (req, res) => {
  const listId = parseInt(req.params.listId);

  try {
    const result = await pool.query(
      `SELECT symbol, num_shares FROM StockListItem WHERE list_id = $1`,
      [listId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Fetch list items failed:', err);
    res.status(500).json({ error: 'Failed to fetch list items' });
  }
};

exports.createStockList = async (req, res) => {
  const userId = getUserId(req);
  const { list_name, visibility, items } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO StockList (user_id, list_name, visibility) VALUES ($1, $2, $3) RETURNING list_id`,
      [userId, list_name, visibility]
    );
    const listId = result.rows[0].list_id;

    for (const item of items) {
      await pool.query(
        `INSERT INTO StockListItem (list_id, symbol, num_shares) VALUES ($1, $2, $3)`,
        [listId, item.symbol, item.num_shares]
      );
    }
    res.status(201).json({ listId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStockList = async (req, res) => {
  const userId = parseInt(req.headers['x-user-id']);
  const listId = parseInt(req.params.listId);

  try {
    // Check if list belongs to user
    const result = await pool.query(`SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`, [listId, userId]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'Not authorized' });

    // Delete
    await pool.query(`DELETE FROM StockList WHERE list_id = $1`, [listId]);
    res.status(204).send();
  } catch (err) {
    console.error('❌ Delete failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
};


exports.shareStockList = async (req, res) => {
  const { listId } = req.params;
  try {
    await pool.query(`UPDATE StockList SET visibility = 'shared' WHERE list_id = $1`, [listId]);
    res.status(200).json({ message: 'Shared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.shareStockListWithFriend = async (req, res) => {
  const userId = parseInt(req.headers['x-user-id']) || 1;
  const { friendId } = req.body;
  const listId = parseInt(req.params.listId);

  try {
    // Make sure the list belongs to the user
    const list = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`,
      [listId, userId]
    );

    if (list.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this list' });
    }

    // Share with friend
    await pool.query(
      `INSERT INTO StockListShare (list_id, shared_with)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [listId, friendId]
    );

    // Update visibility to 'shared'
    await pool.query(
      `UPDATE StockList SET visibility = 'shared' WHERE list_id = $1`,
      [listId]
    );

    res.status(200).json({ message: 'List shared successfully' });
  } catch (err) {
    console.error('❌ Share failed:', err);
    res.status(500).json({ error: 'Could not share list' });
  }
};

exports.unshareStockList = async (req, res) => {
  const userId = parseInt(req.headers['x-user-id']) || 1;
  const listId = parseInt(req.params.listId);

  try {
    // Verify ownership
    const result = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`,
      [listId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this list' });
    }

    // Remove all shares
    await pool.query(
      `DELETE FROM StockListShare WHERE list_id = $1`,
      [listId]
    );

    // Update visibility
    await pool.query(
      `UPDATE StockList SET visibility = 'private' WHERE list_id = $1`,
      [listId]
    );

    res.status(200).json({ message: 'List is now private' });
  } catch (err) {
    console.error('❌ Unshare list failed:', err);
    res.status(500).json({ error: 'Failed to unshare list' });
  }
};

exports.unshareStockListWithFriend = async (req, res) => {
  const userId = parseInt(req.headers['x-user-id']) || 1;
  const listId = parseInt(req.params.listId);
  const { friendId }  = req.body;

  try {
    // Make sure the list belongs to the current user
    const list = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`,
      [listId, userId]
    );

    if (list.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this list' });
    }

    // Delete the share
    await pool.query(
      `DELETE FROM StockListShare WHERE list_id = $1 AND shared_with = $2`,
      [listId, friendId]
    );

    res.status(200).json({ message: 'Unshared successfully' });
  } catch (err) {
    console.error('❌ Unshare failed:', err);
    res.status(500).json({ error: 'Could not unshare list' });
  }
};




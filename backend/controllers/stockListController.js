const pool = require('../db/db');

const getUserId = (req) => parseInt(req.headers['x-user-id']) || 1;

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
      UNION ALL
      (
        SELECT sl.*, sli.symbol, sli.num_shares, NULL AS shared_by
        FROM StockList sl
        LEFT JOIN StockListItem sli ON sl.list_id = sli.list_id
        WHERE sl.visibility = 'public'
          AND sl.user_id != $1
          AND sl.list_id NOT IN (
            SELECT list_id FROM StockListShare WHERE shared_with = $1
          )
      )
    `, [userId]);

    res.status(200).json(rows);
  } catch (err) {
    console.error('❌ getAllStockLists failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSharedStockLists = async (req, res) => {
  const userId = getUserId(req);
  try {
    const result = await pool.query(`
      SELECT sl.*, sli.symbol, sli.num_shares, ua.username AS shared_by
      FROM StockListShare s
      JOIN StockList sl ON s.list_id = sl.list_id
      LEFT JOIN StockListItem sli ON sl.list_id = sli.list_id
      JOIN UserAccount ua ON sl.user_id = ua.user_id
      WHERE s.shared_with = $1
    `, [userId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('getSharedStockLists failed:', err);
    res.status(500).json({ error: 'Could not retrieve shared lists' });
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

    res.status(201).json({ success: true, message: 'List created', listId });
  } catch (err) {
    console.error('❌ createStockList failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateStockListVisibility = async (req, res) => {
  const userId = getUserId(req);
  const listId = parseInt(req.params.listId);
  const { visibility } = req.body;

  const allowedVisibilities = ['private', 'public'];
  if (!allowedVisibilities.includes(visibility)) {
    return res.status(400).json({ error: 'Invalid visibility option' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`,
      [listId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this list' });
    }

    await pool.query(`DELETE FROM StockListShare WHERE list_id = $1`, [listId]);
    await pool.query(
      `UPDATE StockList SET visibility = $1 WHERE list_id = $2`,
      [visibility, listId]
    );

    res.status(200).json({ success: true, message: 'Visibility updated' });
  } catch (err) {
    console.error('❌ updateVisibility failed:', err);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
};

exports.deleteStockList = async (req, res) => {
  const userId = getUserId(req);
  const listId = parseInt(req.params.listId);

  try {
    const result = await pool.query(`SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`, [listId, userId]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'Not authorized' });

    await pool.query(`DELETE FROM StockList WHERE list_id = $1`, [listId]);
    res.status(204).send(); // No content, frontend checks for 204 or 200
  } catch (err) {
    console.error('❌ deleteStockList failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
};

exports.shareStockListWithFriend = async (req, res) => {
  const userId = getUserId(req);
  const { friendId } = req.body;
  const listId = parseInt(req.params.listId);

  try {
    const list = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`,
      [listId, userId]
    );

    if (list.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this list' });
    }

    await pool.query(
      `INSERT INTO StockListShare (list_id, shared_with)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [listId, friendId]
    );

    await pool.query(
      `UPDATE StockList SET visibility = 'shared' WHERE list_id = $1`,
      [listId]
    );

    res.status(200).json({ success: true, message: 'List shared successfully' });
  } catch (err) {
    console.error('❌ shareStockListWithFriend failed:', err);
    res.status(500).json({ error: 'Could not share list' });
  }
};

exports.unshareStockList = async (req, res) => {
  const userId = getUserId(req);
  const listId = parseInt(req.params.listId);

  try {
    const result = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`,
      [listId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this list' });
    }

    await pool.query(`DELETE FROM StockListShare WHERE list_id = $1`, [listId]);
    await pool.query(`UPDATE StockList SET visibility = 'private' WHERE list_id = $1`, [listId]);

    res.status(200).json({ success: true, message: 'List is now private' });
  } catch (err) {
    console.error('❌ unshareStockList failed:', err);
    res.status(500).json({ error: 'Failed to unshare list' });
  }
};

exports.unshareStockListWithFriend = async (req, res) => {
  const userId = getUserId(req);
  const listId = parseInt(req.params.listId);
  const { friendId } = req.body;

  try {
    const list = await pool.query(
      `SELECT * FROM StockList WHERE list_id = $1 AND user_id = $2`,
      [listId, userId]
    );

    if (list.rows.length === 0) {
      return res.status(403).json({ error: 'You do not own this list' });
    }

    await pool.query(
      `DELETE FROM StockListShare WHERE list_id = $1 AND shared_with = $2`,
      [listId, friendId]
    );

    res.status(200).json({ success: true, message: 'Unshared successfully' });
  } catch (err) {
    console.error('❌ unshareStockListWithFriend failed:', err);
    res.status(500).json({ error: 'Could not unshare list' });
  }
};

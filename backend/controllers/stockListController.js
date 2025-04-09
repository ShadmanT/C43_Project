// controllers/stockListController.js
const pool = require('../db/db');

// TEMP: simulate user auth middleware
const getUserId = (req) => parseInt(req.headers['x-user-id']) || 1;
 // replace with req.user.id when auth is ready

exports.getAllStockLists = async (req, res) => {
  const userId = getUserId(req);
  try {
    const { rows } = await pool.query(`
      SELECT sl.*, sli.symbol, sli.num_shares
      FROM StockList sl
      LEFT JOIN StockListItem sli ON sl.list_id = sli.list_id
      WHERE sl.user_id = $1 OR sl.visibility = 'public'
    `, [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  const userId = getUserId(req);
  const listId = req.params.listId;
  try {
    await pool.query(`DELETE FROM StockList WHERE list_id = $1 AND user_id = $2`, [listId, userId]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
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


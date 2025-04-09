const express = require('express');
const router = express.Router();
const stockListController = require('../controllers/stockListController');

router.get('/', stockListController.getAllStockLists);
router.post('/', stockListController.createStockList);
router.delete('/:listId', stockListController.deleteStockList);
router.post('/:listId/share', stockListController.shareStockList);

module.exports = router;
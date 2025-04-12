const express = require('express');
const router = express.Router();
const stockListController = require('../controllers/stockListController');

router.get('/', stockListController.getAllStockLists);
router.get('/shared', stockListController.getSharedStockLists);
router.get('/:listId', stockListController.getStockListById);
router.get('/:listId/items', stockListController.getStockListItems);
router.post('/', stockListController.createStockList);
router.delete('/:listId', stockListController.deleteStockList);
router.post('/:listId/share', stockListController.shareStockList);
router.post('/:listId/share-with-friend', stockListController.shareStockListWithFriend);
router.post('/:listId/unshare', stockListController.unshareStockList);
router.post('/:listId/unshare-with-friend', stockListController.unshareStockListWithFriend);


module.exports = router;
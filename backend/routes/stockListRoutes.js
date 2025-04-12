const express = require('express');
const router = express.Router();
const stockListController = require('../controllers/stockListController');

router.get('/', stockListController.getAllStockLists);
router.get('/shared', stockListController.getSharedStockLists);
router.post('/', stockListController.createStockList);
router.delete('/:listId', stockListController.deleteStockList);
router.post('/:listId/share-with-friend', stockListController.shareStockListWithFriend);
router.post('/:listId/unshare', stockListController.unshareStockList);
router.post('/:listId/unshare-with-friend', stockListController.unshareStockListWithFriend);
router.put('/:listId/visibility', stockListController.updateStockListVisibility);

module.exports = router;

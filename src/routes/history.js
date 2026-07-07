const express = require('express');
const router = express.Router();
const {
    getPortfolioHistory,
    getStockHistory,
    getPerformance,
    getNiftyHistory
} = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

router.get('/portfolio', protect, getPortfolioHistory);
router.get('/performance', protect, getPerformance);
router.get('/nifty', protect, getNiftyHistory);
router.get('/stock/:symbol', protect, getStockHistory);

module.exports = router;
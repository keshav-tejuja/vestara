const express = require('express');
const router = express.Router();
const {
    getNewsForSymbol,
    getPortfolioNews,
    getNewsHistory
} = require('../controllers/newsController');
const { protect } = require('../middleware/auth');
const { newsQueue } = require('../config/queues');

// All routes are private
router.get('/portfolio', protect, getPortfolioNews);
router.get('/history/:symbol', protect, getNewsHistory);
router.get('/:symbol', protect, getNewsForSymbol);
router.post('/trigger', protect, async (req, res) => {
    await newsQueue.add('fetch-news', {
        triggeredAt: new Date().toISOString(),
        manual: true
    });
    res.json({ message: 'News job triggered — check Bull Board' });
});

module.exports = router;
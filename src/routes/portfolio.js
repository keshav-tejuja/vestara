const express = require('express');
const router = express.Router();
const {
    uploadPortfolio,
    getPortfolio,
    getPortfolioPnL  // ADD THIS
} = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');
const { priceQueue } = require('../config/queues');

router.post('/upload', protect, upload.single('portfolio'), uploadPortfolio);
router.get('/', protect, getPortfolio);
router.get('/pnl', protect, getPortfolioPnL); // ADD THIS
// Manual trigger for testing
router.post('/trigger-price-job', protect, async (req, res) => {
    await priceQueue.add('fetch-prices', {
        triggeredAt: new Date().toISOString(),
        manual: true
    });
    res.json({ message: 'Price job added to queue' });
});

module.exports = router;
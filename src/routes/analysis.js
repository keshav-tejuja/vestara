const express = require('express');
const router = express.Router();
const {
    runPortfolioAnalysis,
    getLatestAnalysis,
    getAnalysisHistory
} = require('../controllers/analysisController');
const { protect } = require('../middleware/auth');
const { reportQueue } = require('../config/queues');

router.post('/run', protect, runPortfolioAnalysis);
router.get('/latest', protect, getLatestAnalysis);
router.get('/history', protect, getAnalysisHistory);
router.post('/trigger-report', protect, async (req, res) => {
    await reportQueue.add('generate-reports', {
        triggeredAt: new Date().toISOString(),
        manual: true
    });
    res.json({ message: 'Report job triggered — check your email in ~30 seconds' });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const {
    uploadPortfolio,
    getPortfolio,
    getPortfolioPnL  // ADD THIS
} = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

router.post('/upload', protect, upload.single('portfolio'), uploadPortfolio);
router.get('/', protect, getPortfolio);
router.get('/pnl', protect, getPortfolioPnL); // ADD THIS

module.exports = router;
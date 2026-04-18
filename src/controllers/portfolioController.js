const { parseCSV } = require('../utils/csvParser');
const Portfolio = require('../models/portfolio');
const { calculatePortfolioPnL } = require('../services/pnlService');

const uploadPortfolio = async (req, res) => {
    // ... same as before, no changes
};

const getPortfolio = async (req, res) => {
    // ... same as before, no changes
};

// ADD THIS NEW CONTROLLER
// @route   GET /portfolio/pnl
// @desc    Get live P&L for user's portfolio
// @access  Private
const getPortfolioPnL = async (req, res) => {
    try {
        // 1. Find user's portfolio
        const portfolio = await Portfolio.findByUserId(req.user.id);

        if (!portfolio) {
            return res.status(404).json({
                error: 'No portfolio found. Please upload a CSV first.'
            });
        }

        // 2. Calculate live P&L
        const pnlData = await calculatePortfolioPnL(portfolio.id);

        res.status(200).json({
            portfolio_id: portfolio.id,
            ...pnlData
        });

    } catch (error) {
        console.error('P&L error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { uploadPortfolio, getPortfolio, getPortfolioPnL };
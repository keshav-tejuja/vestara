const { parseCSV } = require('../utils/csvParser');
const Portfolio = require('../models/portfolio');
const { calculatePortfolioPnL } = require('../services/pnlService');

// @route   POST /portfolio/upload
// @desc    Upload CSV and store holdings
// @access  Private
const uploadPortfolio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a CSV file.' });
        }

        const { holdings, errors } = await parseCSV(req.file.buffer);

        if (holdings.length === 0) {
            return res.status(400).json({
                error: 'No valid holdings found in CSV.',
                details: errors
            });
        }

        let portfolio = await Portfolio.findByUserId(req.user.id);

        if (portfolio) {
            await Portfolio.deleteHoldings(portfolio.id);
            await Portfolio.updateTimestamp(portfolio.id);
        } else {
            portfolio = await Portfolio.create(req.user.id);
        }

        const insertedHoldings = await Portfolio.insertHoldings(portfolio.id, holdings);

        res.status(200).json({
            message: 'Portfolio uploaded successfully.',
            portfolio_id: portfolio.id,
            total_holdings: insertedHoldings.length,
            holdings: insertedHoldings,
            warnings: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Upload error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// @route   GET /portfolio
// @desc    Get user's portfolio with holdings
// @access  Private
const getPortfolio = async (req, res) => {
    try {
        const portfolio = await Portfolio.findByUserId(req.user.id);

        if (!portfolio) {
            return res.status(404).json({
                error: 'No portfolio found. Please upload a CSV first.'
            });
        }

        const { holdings } = await Portfolio.getWithHoldings(portfolio.id);

        res.status(200).json({
            portfolio_id: portfolio.id,
            name: portfolio.name,
            uploaded_at: portfolio.uploaded_at,
            updated_at: portfolio.updated_at,
            total_holdings: holdings.length,
            holdings
        });

    } catch (error) {
        console.error('Get portfolio error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   GET /portfolio/pnl
// @desc    Get live P&L for user's portfolio
// @access  Private
const getPortfolioPnL = async (req, res) => {
    try {
        const portfolio = await Portfolio.findByUserId(req.user.id);

        if (!portfolio) {
            return res.status(404).json({
                error: 'No portfolio found. Please upload a CSV first.'
            });
        }

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
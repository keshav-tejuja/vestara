const Portfolio = require('../models/portfolio');
const Analysis = require('../models/analysis');
const { calculateRisk } = require('../services/riskEngine');
const { analyzePortfolio } = require('../services/aiService');
const { getBulkPrices } = require('../services/marketData');
const { calculatePortfolioPnL } = require('../services/pnlService');

// Core function — runs full analysis pipeline
// Used by both the API route and the BullMQ report job
const runAnalysis = async (portfolioId) => {
    // 1. Get holdings
    const { holdings } = await Portfolio.getWithHoldings(portfolioId);
    if (!holdings || holdings.length === 0) {
        throw new Error('No holdings found');
    }

    // 2. Get current prices
    const symbols = holdings.map(h => h.symbol);
    const prices = await getBulkPrices(symbols);

    // 3. Calculate P&L
    const pnlData = await calculatePortfolioPnL(portfolioId);
    const { summary } = pnlData;

    // 4. Calculate risk metrics
    const {
        riskScore,
        riskLevel,
        sectorExposure,
        concentrations,
        redFlags
    } = calculateRisk(holdings, prices);

    // 5. Send to Groq AI for analysis
    console.log('🤖 Sending portfolio to Groq AI for analysis...');
    const aiResponse = await analyzePortfolio({
        holdings,
        prices,
        riskScore,
        riskLevel,
        sectorExposure,
        concentrations,
        redFlags,
        totalInvested: summary.total_invested,
        totalCurrentValue: summary.total_current_value,
        totalPnL: summary.total_pnl,
        totalPnLPercent: summary.total_pnl_percent
    });

    // 6. Save to DB
    const saved = await Analysis.save({
        portfolioId,
        riskScore,
        riskLevel,
        sectorExposure,
        redFlags,
        suggestions: aiResponse.suggestions || [],
        aiReasoning: aiResponse.overall_assessment,
        rawResponse: aiResponse
    });

    return {
        analysis_id: saved.id,
        risk_score: riskScore,
        risk_level: riskLevel,
        sector_exposure: sectorExposure,
        red_flags: redFlags,
        ai_insights: aiResponse,
        created_at: saved.created_at
    };
};

// @route   POST /analysis/run
// @desc    Run fresh AI analysis on portfolio
// @access  Private
const runPortfolioAnalysis = async (req, res) => {
    try {
        const portfolio = await Portfolio.findByUserId(req.user.id);

        if (!portfolio) {
            return res.status(404).json({
                error: 'No portfolio found. Please upload a CSV first.'
            });
        }

        console.log(`🔍 Running analysis for portfolio ${portfolio.id}`);
        const result = await runAnalysis(portfolio.id);

        res.status(200).json({
            message: 'Analysis complete.',
            ...result
        });

    } catch (error) {
        console.error('Analysis error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// @route   GET /analysis/latest
// @desc    Get latest saved analysis
// @access  Private
const getLatestAnalysis = async (req, res) => {
    try {
        const portfolio = await Portfolio.findByUserId(req.user.id);

        if (!portfolio) {
            return res.status(404).json({ error: 'No portfolio found.' });
        }

        const analysis = await Analysis.getLatest(portfolio.id);

        if (!analysis) {
            return res.status(404).json({
                error: 'No analysis found. Run /analysis/run first.'
            });
        }

        res.status(200).json({ analysis });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   GET /analysis/history
// @desc    Get analysis history
// @access  Private
const getAnalysisHistory = async (req, res) => {
    try {
        const portfolio = await Portfolio.findByUserId(req.user.id);
        if (!portfolio) {
            return res.status(404).json({ error: 'No portfolio found.' });
        }

        const history = await Analysis.getHistory(portfolio.id);
        res.status(200).json({ history });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { runPortfolioAnalysis, getLatestAnalysis, getAnalysisHistory, runAnalysis };
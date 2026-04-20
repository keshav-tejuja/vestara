const Portfolio = require('../models/portfolio');
const {
    fetchNewsForSymbol,
    fetchNewsForPortfolio,
    getNewsFromDB,
    getPortfolioSentiment
} = require('../services/newsService');

// @route   GET /news/:symbol
// @desc    Get news + sentiment for a specific stock
// @access  Private
const getNewsForSymbol = async (req, res) => {
    try {
        const { symbol } = req.params;

        if (!symbol) {
            return res.status(400).json({ error: 'Symbol is required.' });
        }

        const news = await fetchNewsForSymbol(symbol.toUpperCase());

        if (news.length === 0) {
            return res.status(200).json({
                symbol: symbol.toUpperCase(),
                message: 'No recent news found.',
                news: []
            });
        }

        // Calculate sentiment summary for this stock
        const positiveCount = news.filter(n => n.sentiment === 'positive').length;
        const negativeCount = news.filter(n => n.sentiment === 'negative').length;
        const neutralCount = news.filter(n => n.sentiment === 'neutral').length;

        res.status(200).json({
            symbol: symbol.toUpperCase(),
            total_articles: news.length,
            sentiment_summary: {
                positive: positiveCount,
                negative: negativeCount,
                neutral: neutralCount,
                overall: positiveCount > negativeCount ? 'positive'
                    : negativeCount > positiveCount ? 'negative'
                        : 'neutral'
            },
            news
        });

    } catch (error) {
        console.error('Get news error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// @route   GET /news/portfolio
// @desc    Get news for all stocks in user's portfolio
// @access  Private
const getPortfolioNews = async (req, res) => {
    try {
        // Get user's portfolio holdings
        const portfolio = await Portfolio.findByUserId(req.user.id);

        if (!portfolio) {
            return res.status(404).json({
                error: 'No portfolio found. Please upload a CSV first.'
            });
        }

        const { holdings } = await Portfolio.getWithHoldings(portfolio.id);
        const symbols = holdings.map(h => h.symbol);

        if (symbols.length === 0) {
            return res.status(200).json({ message: 'No holdings found.', news: {} });
        }

        // Fetch news for all symbols
        const allNews = await fetchNewsForPortfolio(symbols);

        // Get overall portfolio sentiment
        const sentiment = getPortfolioSentiment(allNews);

        res.status(200).json({
            portfolio_id: portfolio.id,
            symbols_covered: symbols.length,
            portfolio_sentiment: sentiment,
            news: allNews
        });

    } catch (error) {
        console.error('Portfolio news error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// @route   GET /news/history/:symbol
// @desc    Get stored news history for a symbol (from DB, no API call)
// @access  Private
const getNewsHistory = async (req, res) => {
    try {
        const { symbol } = req.params;
        const hours = parseInt(req.query.hours) || 24;

        const news = await getNewsFromDB(symbol.toUpperCase(), hours);

        res.status(200).json({
            symbol: symbol.toUpperCase(),
            hours_back: hours,
            total: news.length,
            news
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { getNewsForSymbol, getPortfolioNews, getNewsHistory };
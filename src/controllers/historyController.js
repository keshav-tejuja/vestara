const Portfolio = require('../models/portfolio');
const PriceHistory = require('../models/priceHistory');
const { getBulkPrices } = require('../services/marketData');

// @route   GET /history/portfolio?days=30
// @desc    Get portfolio value over time
// @access  Private
const getPortfolioHistory = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const portfolio = await Portfolio.findByUserId(req.user.id);

        if (!portfolio) {
            return res.status(404).json({ error: 'No portfolio found.' });
        }

        const history = await PriceHistory.getPortfolioHistory(portfolio.id, days);

        if (history.length === 0) {
            return res.status(200).json({
                message: 'No history yet — trigger a price job first.',
                portfolio_id: portfolio.id,
                days,
                data_points: 0,
                history: []
            });
        }

        // Format for charting — labels + values arrays
        const chartData = {
            labels: history.map(h => h.date),
            portfolio_value: history.map(h => parseFloat(h.total_value)),
            total_invested: history.map(h => parseFloat(h.total_invested)),
            pnl: history.map(h => parseFloat(h.total_pnl)),
            pnl_percent: history.map(h => parseFloat(h.pnl_percent))
        };

        // Summary stats
        const first = history[0];
        const last = history[history.length - 1];
        const periodChange = parseFloat(last.total_value) - parseFloat(first.total_value);
        const periodChangePercent = ((periodChange / parseFloat(first.total_value)) * 100).toFixed(2);

        res.status(200).json({
            portfolio_id: portfolio.id,
            days,
            data_points: history.length,
            period_summary: {
                start_value: parseFloat(first.total_value),
                end_value: parseFloat(last.total_value),
                period_change: parseFloat(periodChange.toFixed(2)),
                period_change_percent: parseFloat(periodChangePercent),
                is_profit: periodChange >= 0
            },
            chart_data: chartData
        });

    } catch (error) {
        console.error('Portfolio history error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   GET /history/stock/:symbol?days=30
// @desc    Get price history for a specific stock
// @access  Private
const getStockHistory = async (req, res) => {
    try {
        const { symbol } = req.params;
        const days = parseInt(req.query.days) || 30;

        const history = await PriceHistory.getDailyPrices(symbol.toUpperCase(), days);

        if (history.length === 0) {
            return res.status(200).json({
                symbol: symbol.toUpperCase(),
                message: 'No price history yet.',
                history: []
            });
        }

        // Format for charting
        const chartData = {
            labels: history.map(h => h.date),
            prices: history.map(h => parseFloat(h.price)),
            volumes: history.map(h => parseInt(h.volume) || 0)
        };

        // Calculate stats over period
        const prices = chartData.prices;
        const highPrice = Math.max(...prices);
        const lowPrice = Math.min(...prices);
        const startPrice = prices[0];
        const endPrice = prices[prices.length - 1];
        const priceChange = endPrice - startPrice;
        const priceChangePercent = ((priceChange / startPrice) * 100).toFixed(2);

        // Get volatility
        const volatility = await PriceHistory.getVolatility(symbol.toUpperCase(), days);

        res.status(200).json({
            symbol: symbol.toUpperCase(),
            days,
            data_points: history.length,
            period_stats: {
                start_price: startPrice,
                end_price: endPrice,
                high: highPrice,
                low: lowPrice,
                price_change: parseFloat(priceChange.toFixed(2)),
                price_change_percent: parseFloat(priceChangePercent),
                volatility: volatility.volatility,
                avg_daily_return: volatility.avg_daily_return
            },
            chart_data: chartData
        });

    } catch (error) {
        console.error('Stock history error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   GET /history/performance
// @desc    Get best/worst performers + weekly change
// @access  Private
const getPerformance = async (req, res) => {
    try {
        const portfolio = await Portfolio.findByUserId(req.user.id);

        if (!portfolio) {
            return res.status(404).json({ error: 'No portfolio found.' });
        }

        const { holdings } = await Portfolio.getWithHoldings(portfolio.id);
        const symbols = holdings.map(h => h.symbol);

        // Get current prices
        const prices = await getBulkPrices(symbols);

        // Calculate P&L per holding
        const performances = holdings
            .filter(h => prices[h.symbol])
            .map(h => {
                const currentPrice = prices[h.symbol].currentPrice;
                const avgCost = parseFloat(h.avg_cost);
                const quantity = parseFloat(h.quantity);
                const pnl = (currentPrice - avgCost) * quantity;
                const pnlPercent = ((currentPrice - avgCost) / avgCost * 100).toFixed(2);

                return {
                    symbol: h.symbol,
                    company_name: h.company_name,
                    avg_cost: avgCost,
                    current_price: currentPrice,
                    pnl: parseFloat(pnl.toFixed(2)),
                    pnl_percent: parseFloat(pnlPercent),
                    today_change_percent: prices[h.symbol].changePercent
                };
            })
            .sort((a, b) => b.pnl_percent - a.pnl_percent);

        // Weekly portfolio performance
        const weeklyPerf = await PriceHistory.getWeeklyPerformance(portfolio.id);

        res.status(200).json({
            portfolio_id: portfolio.id,
            weekly_performance: {
                current_value: weeklyPerf?.current_value || null,
                week_ago_value: weeklyPerf?.week_ago_value || null,
                weekly_change_percent: weeklyPerf
                    ? parseFloat(parseFloat(weeklyPerf.weekly_change_percent).toFixed(2))
                    : null,
                message: !weeklyPerf?.week_ago_value
                    ? 'Need 7+ days of data for weekly comparison'
                    : null
            },
            best_performer: performances[0] || null,
            worst_performer: performances[performances.length - 1] || null,
            all_performers: performances
        });

    } catch (error) {
        console.error('Performance error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   GET /history/nifty?days=30
// @desc    Get Nifty50 history for portfolio comparison
// @access  Private
const getNiftyHistory = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;

        // Fetch Nifty50 index data
        // ^NSEI is the Yahoo Finance symbol for Nifty50
        const { getStockPrice } = require('../services/marketData');
        const niftyData = await getStockPrice('^NSEI');

        // Get Nifty history from our price_history table
        const history = await PriceHistory.getDailyPrices('^NSEI', days);

        res.status(200).json({
            index: 'NIFTY50',
            current_price: niftyData?.currentPrice || null,
            change_percent: niftyData?.changePercent || null,
            days,
            history: history.map(h => ({
                date: h.date,
                price: parseFloat(h.price)
            }))
        });

    } catch (error) {
        console.error('Nifty history error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = {
    getPortfolioHistory,
    getStockHistory,
    getPerformance,
    getNiftyHistory
};
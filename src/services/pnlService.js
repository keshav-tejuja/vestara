const { getBulkPrices } = require('./marketData');
const Portfolio = require('../models/portfolio');

// Calculate P&L for a single holding
const calculateHoldingPnL = (holding, currentPrice) => {
    const avgCost = parseFloat(holding.avg_cost);
    const quantity = parseFloat(holding.quantity);
    const investedValue = avgCost * quantity;
    const currentValue = currentPrice * quantity;
    const pnl = currentValue - investedValue;
    const pnlPercent = ((pnl / investedValue) * 100).toFixed(2);

    return {
        id: holding.id,
        symbol: holding.symbol,
        company_name: holding.company_name,
        quantity,
        avg_cost: avgCost,
        current_price: currentPrice,
        invested_value: parseFloat(investedValue.toFixed(2)),
        current_value: parseFloat(currentValue.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        pnl_percent: parseFloat(pnlPercent),
        // positive = profit, negative = loss
        is_profit: pnl >= 0
    };
};

// Calculate full portfolio P&L
const calculatePortfolioPnL = async (portfolioId) => {
    // 1. Get all holdings
    const { holdings } = await Portfolio.getWithHoldings(portfolioId);

    if (!holdings || holdings.length === 0) {
        throw new Error('No holdings found in portfolio');
    }

    // 2. Get all unique symbols
    const symbols = [...new Set(holdings.map(h => h.symbol))];

    // 3. Fetch all prices at once (parallel)
    const prices = await getBulkPrices(symbols);

    // 4. Calculate P&L for each holding
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const holdingsWithPnL = [];

    for (const holding of holdings) {
        const priceData = prices[holding.symbol];

        if (!priceData) {
            // Price fetch failed for this stock — skip it
            holdingsWithPnL.push({
                ...holding,
                error: 'Price unavailable'
            });
            continue;
        }

        const holdingPnL = calculateHoldingPnL(holding, priceData.currentPrice);
        totalInvested += holdingPnL.invested_value;
        totalCurrentValue += holdingPnL.current_value;

        holdingsWithPnL.push({
            ...holdingPnL,
            change: priceData.change,
            change_percent: priceData.changePercent,
            volume: priceData.volume
        });
    }

    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = ((totalPnL / totalInvested) * 100).toFixed(2);

    return {
        summary: {
            total_invested: parseFloat(totalInvested.toFixed(2)),
            total_current_value: parseFloat(totalCurrentValue.toFixed(2)),
            total_pnl: parseFloat(totalPnL.toFixed(2)),
            total_pnl_percent: parseFloat(totalPnLPercent),
            is_profit: totalPnL >= 0,
            last_updated: new Date().toISOString()
        },
        holdings: holdingsWithPnL
    };
};

module.exports = { calculatePortfolioPnL };
const { pool } = require('../../config/db');
const { getBulkPrices } = require('../../services/marketData');
const { storePriceHistory } = require('../../services/marketData');
const { calculatePortfolioPnL } = require('../../services/pnlService');
const { sendPnLUpdate } = require('../../socket');
const { checkPriceAlerts, checkVolumeSpikes } = require('../../services/alertService');
const PriceHistory = require('../../models/priceHistory');

const priceProcessor = async (job) => {
    console.log(`🔄 Processing price job #${job.id}`);

    // 1. Get all unique symbols
    const symbolResult = await pool.query(
        `SELECT DISTINCT symbol FROM holdings`
    );
    const symbols = [
        ...symbolResult.rows.map(r => r.symbol),
        '^NSEI' // Nifty50 index
    ];

    if (symbols.length === 0) {
        console.log('No symbols to fetch');
        return { updated: 0 };
    }

    // 2. Fetch all prices
    const prices = await getBulkPrices(symbols);

    // 3. Store price history — NEW
    await storePriceHistory(prices);

    // 4. Check alerts
    await checkPriceAlerts(prices);
    await checkVolumeSpikes(prices);

    // 5. Get all portfolios
    const portfolioResult = await pool.query(`
    SELECT DISTINCT p.id as portfolio_id, p.user_id
    FROM portfolios p
    INNER JOIN holdings h ON h.portfolio_id = p.id
  `);

    const portfolios = portfolioResult.rows;
    const results = { updated: 0, failed: 0 };

    for (const { portfolio_id, user_id } of portfolios) {
        try {
            const pnlData = await calculatePortfolioPnL(portfolio_id);

            // 6. Store portfolio snapshot — NEW
            await PriceHistory.storePortfolioSnapshot({
                portfolioId: portfolio_id,
                totalInvested: pnlData.summary.total_invested,
                totalValue: pnlData.summary.total_current_value,
                totalPnl: pnlData.summary.total_pnl,
                pnlPercent: pnlData.summary.total_pnl_percent
            });

            // 7. Push real-time update
            sendPnLUpdate(user_id, {
                type: 'pnl_update',
                portfolio_id,
                ...pnlData,
                timestamp: new Date().toISOString()
            });

            results.updated++;
            await job.updateProgress(
                Math.round((results.updated / portfolios.length) * 100)
            );

        } catch (error) {
            results.failed++;
            console.error(`Failed portfolio ${portfolio_id}:`, error.message);
        }
    }

    console.log(`✅ Price job done — Updated: ${results.updated}, Failed: ${results.failed}`);
    return results;
};

module.exports = priceProcessor;
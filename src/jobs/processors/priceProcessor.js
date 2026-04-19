const { pool } = require('../../config/db');
const { getBulkPrices } = require('../../services/marketData');
const { calculatePortfolioPnL } = require('../../services/pnlService');
const { sendPnLUpdate } = require('../../socket');
const { checkPriceAlerts, checkVolumeSpikes } = require('../../services/alertService');

const priceProcessor = async (job) => {
    console.log(`🔄 Processing price job #${job.id}`);

    // 1. Get all unique symbols across all portfolios
    const symbolResult = await pool.query(
        `SELECT DISTINCT symbol FROM holdings`
    );
    const symbols = symbolResult.rows.map(r => r.symbol);

    if (symbols.length === 0) {
        console.log('No symbols to fetch');
        return { updated: 0 };
    }

    // 2. Fetch all prices at once
    const prices = await getBulkPrices(symbols);

    // 3. Check alerts against new prices
    await checkPriceAlerts(prices);
    await checkVolumeSpikes(prices);

    // 4. Get all portfolios
    const portfolioResult = await pool.query(`
    SELECT DISTINCT p.id as portfolio_id, p.user_id
    FROM portfolios p
    INNER JOIN holdings h ON h.portfolio_id = p.id
  `);

    const portfolios = portfolioResult.rows;
    const results = { updated: 0, failed: 0 };

    // 5. Update P&L for each portfolio
    for (const { portfolio_id, user_id } of portfolios) {
        try {
            const pnlData = await calculatePortfolioPnL(portfolio_id);

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
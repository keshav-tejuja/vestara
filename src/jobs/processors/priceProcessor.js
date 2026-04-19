const { pool } = require('../../config/db');
const { calculatePortfolioPnL } = require('../../services/pnlService');
const { sendPnLUpdate } = require('../../socket');

// This function runs every time a price job is picked up
// job.data contains whatever we passed when adding the job
const priceProcessor = async (job) => {
    console.log(`🔄 Processing price job #${job.id}`);

    // 1. Get all portfolios that have holdings
    const result = await pool.query(`
    SELECT DISTINCT p.id as portfolio_id, p.user_id
    FROM portfolios p
    INNER JOIN holdings h ON h.portfolio_id = p.id
  `);

    const portfolios = result.rows;

    if (portfolios.length === 0) {
        console.log('No portfolios to update');
        return { updated: 0 };
    }

    const results = {
        updated: 0,
        failed: 0,
        portfolios: []
    };

    // 2. Update P&L for each portfolio
    for (const { portfolio_id, user_id } of portfolios) {
        try {
            const pnlData = await calculatePortfolioPnL(portfolio_id);

            // 3. Push to user via Socket.io
            sendPnLUpdate(user_id, {
                type: 'pnl_update',
                portfolio_id,
                ...pnlData,
                timestamp: new Date().toISOString()
            });

            results.updated++;
            results.portfolios.push({ portfolio_id, status: 'updated' });

            // Update job progress (visible in Bull Board)
            await job.updateProgress(
                Math.round((results.updated / portfolios.length) * 100)
            );

        } catch (error) {
            results.failed++;
            results.portfolios.push({
                portfolio_id,
                status: 'failed',
                error: error.message
            });
            console.error(`Failed portfolio ${portfolio_id}:`, error.message);
        }
    }

    console.log(`✅ Price job done — Updated: ${results.updated}, Failed: ${results.failed}`);
    return results;
};

module.exports = priceProcessor;
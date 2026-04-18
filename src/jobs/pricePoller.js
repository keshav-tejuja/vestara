const cron = require('node-cron');
const { pool } = require('../config/db');
const { getBulkPrices, isMarketOpen } = require('../services/marketData');
const { calculatePortfolioPnL } = require('../services/pnlService');
const { sendPnLUpdate } = require('../socket');

// Runs every 5 minutes
// Cron syntax: '*/5 * * * *'
// means: every 5th minute, every hour, every day
const startPricePoller = () => {
    cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ Price polling job started:', new Date().toISOString());

        // Skip if market is closed
        if (!isMarketOpen()) {
            console.log('🔴 Market closed — skipping price poll');
            return;
        }

        try {
            // 1. Get all users who have portfolios
            const result = await pool.query(`
        SELECT DISTINCT p.id as portfolio_id, p.user_id
        FROM portfolios p
        INNER JOIN holdings h ON h.portfolio_id = p.id
      `);

            const portfolios = result.rows;

            if (portfolios.length === 0) {
                console.log('No portfolios found');
                return;
            }

            console.log(`📊 Updating P&L for ${portfolios.length} portfolios`);

            // 2. Update P&L for each portfolio
            for (const { portfolio_id, user_id } of portfolios) {
                try {
                    const pnlData = await calculatePortfolioPnL(portfolio_id);

                    // 3. Push update to user via Socket.io
                    sendPnLUpdate(user_id, {
                        type: 'pnl_update',
                        portfolio_id,
                        ...pnlData,
                        timestamp: new Date().toISOString()
                    });

                    console.log(`✅ Updated portfolio ${portfolio_id} for user ${user_id}`);
                } catch (error) {
                    console.error(`❌ Failed to update portfolio ${portfolio_id}:`, error.message);
                }
            }

        } catch (error) {
            console.error('❌ Price polling job failed:', error.message);
        }
    });

    console.log('✅ Price poller started — runs every 5 minutes');
};

module.exports = { startPricePoller };
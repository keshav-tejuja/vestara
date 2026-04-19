const cron = require('node-cron');
const { priceQueue, newsQueue, reportQueue } = require('../config/queues');
const { isMarketOpen } = require('../services/marketData');

const startScheduler = () => {

    // Price jobs — every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        if (!isMarketOpen()) {
            console.log('🔴 Market closed — skipping price job');
            return;
        }

        try {
            await priceQueue.add(
                'fetch-prices',
                { triggeredAt: new Date().toISOString() },
                { jobId: `price-${Date.now()}` } // unique job ID
            );
            console.log('📥 Price job added to queue');
        } catch (error) {
            console.error('Failed to add price job:', error.message);
        }
    });

    // News jobs — every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        try {
            await newsQueue.add(
                'fetch-news',
                { triggeredAt: new Date().toISOString() },
                { jobId: `news-${Date.now()}` }
            );
            console.log('📥 News job added to queue');
        } catch (error) {
            console.error('Failed to add news job:', error.message);
        }
    });

    // Weekly report — every Monday at 8:00 AM IST
    cron.schedule('30 2 * * 1', async () => {
        // 2:30 AM UTC = 8:00 AM IST
        try {
            await reportQueue.add(
                'generate-reports',
                { triggeredAt: new Date().toISOString() },
                { jobId: `report-${Date.now()}` }
            );
            console.log('📥 Weekly report job added to queue');
        } catch (error) {
            console.error('Failed to add report job:', error.message);
        }
    });

    console.log('✅ Job scheduler started');
};

module.exports = { startScheduler };
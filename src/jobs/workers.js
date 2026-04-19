const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const priceProcessor = require('./processors/priceProcessor');
const newsProcessor = require('./processors/newsProcessor');
const reportProcessor = require('./processors/reportProcessor');

const startWorkers = () => {
    // Price Worker
    const priceWorker = new Worker(
        'price-queue',
        priceProcessor,
        {
            connection: redisConnection,
            concurrency: 1  // process one job at a time
        }
    );

    priceWorker.on('completed', (job, result) => {
        console.log(`✅ Price job #${job.id} completed:`, result);
    });

    priceWorker.on('failed', (job, error) => {
        console.error(`❌ Price job #${job.id} failed:`, error.message);
        console.log(`🔄 Will retry — attempt ${job.attemptsMade} of ${job.opts.attempts}`);
    });

    priceWorker.on('error', (error) => {
        console.error('Price worker error:', error.message);
    });

    // News Worker
    const newsWorker = new Worker(
        'news-queue',
        newsProcessor,
        { connection: redisConnection, concurrency: 1 }
    );

    newsWorker.on('completed', (job) => {
        console.log(`✅ News job #${job.id} completed`);
    });

    newsWorker.on('failed', (job, error) => {
        console.error(`❌ News job #${job.id} failed:`, error.message);
    });

    // Report Worker
    const reportWorker = new Worker(
        'report-queue',
        reportProcessor,
        { connection: redisConnection, concurrency: 1 }
    );

    reportWorker.on('completed', (job) => {
        console.log(`✅ Report job #${job.id} completed`);
    });

    reportWorker.on('failed', (job, error) => {
        console.error(`❌ Report job #${job.id} failed:`, error.message);
    });

    console.log('✅ All BullMQ workers started');

    return { priceWorker, newsWorker, reportWorker };
};

module.exports = { startWorkers };
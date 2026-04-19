const { Queue } = require('bullmq');
const { redisConnection } = require('./redis');

// BullMQ needs a raw Redis connection config object
// not the ioredis instance we created earlier
// We'll update redis.js to export both

const defaultJobOptions = {
    attempts: 3,              // retry up to 3 times on failure
    backoff: {
        type: 'exponential',    // wait longer between each retry
        delay: 5000             // start with 5 second wait, then 10s, then 20s
    },
    removeOnComplete: {
        count: 100              // keep last 100 completed jobs in dashboard
    },
    removeOnFail: {
        count: 200              // keep last 200 failed jobs for debugging
    }
};

// Price polling queue
const priceQueue = new Queue('price-queue', {
    connection: redisConnection,
    defaultJobOptions
});

// News fetching queue
const newsQueue = new Queue('news-queue', {
    connection: redisConnection,
    defaultJobOptions
});

// AI report generation queue
const reportQueue = new Queue('report-queue', {
    connection: redisConnection,
    defaultJobOptions
});

console.log('✅ BullMQ queues initialized');

module.exports = { priceQueue, newsQueue, reportQueue };
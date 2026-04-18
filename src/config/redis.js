const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    // ioredis automatically reconnects if connection drops
    retryStrategy: (times) => {
        // retry after 2 seconds, max 10 retries
        if (times > 10) return null;
        return 2000;
    }
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error.message);
});

module.exports = redis;
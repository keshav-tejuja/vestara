const Redis = require('ioredis');
require('dotenv').config();

// Plain connection config for BullMQ
const redisConnection = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
};

// ioredis instance for everything else (caching, pub/sub)
const redis = new Redis({
    ...redisConnection,
    retryStrategy: (times) => {
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
module.exports.redisConnection = redisConnection;
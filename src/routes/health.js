const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const redis = require('../config/redis');

router.get('/', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            db: 'disconnected',
            redis: 'disconnected'
        }
    };

    // Check PostgreSQL
    try {
        await pool.query('SELECT 1'); // simplest possible query
        health.services.db = 'connected';
    } catch (error) {
        health.services.db = 'disconnected';
        health.status = 'degraded';
    }

    // Check Redis
    try {
        await redis.ping(); // Redis responds with "PONG"
        health.services.redis = 'connected';
    } catch (error) {
        health.services.redis = 'disconnected';
        health.status = 'degraded';
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

module.exports = router;
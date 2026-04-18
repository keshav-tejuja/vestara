const { Pool } = require('pg');
require('dotenv').config();

// Pool manages multiple DB connections efficiently
// Instead of opening/closing a connection for every request,
// it keeps a pool of connections ready to use
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Test the connection when server starts
const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL connected successfully');
        client.release(); // release back to pool after test
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        process.exit(1); // stop server if DB fails
    }
};

module.exports = { pool, connectDB };
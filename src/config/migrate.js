const { pool } = require('./db');

const createTables = async () => {
    try {
        // Users table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('✅ Users table created');

        // Portfolios table
        // One user can have one portfolio (we keep it simple for now)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) DEFAULT 'My Portfolio',
        uploaded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('✅ Portfolios table created');

        // Holdings table
        // Each holding = one stock row inside a portfolio
        await pool.query(`
      CREATE TABLE IF NOT EXISTS holdings (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        company_name VARCHAR(150),
        quantity DECIMAL NOT NULL,
        avg_cost DECIMAL NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        console.log('✅ Holdings table created');

        console.log('✅ All tables created successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
};

createTables();
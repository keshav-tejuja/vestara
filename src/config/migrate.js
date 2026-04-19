const { pool } = require('./db');

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Users table ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) DEFAULT 'My Portfolio',
        uploaded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Portfolios table ready');

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
    console.log('✅ Holdings table ready');

    // Alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        alert_type VARCHAR(20) NOT NULL,
        condition VARCHAR(10) NOT NULL,
        target_price DECIMAL,
        is_active BOOLEAN DEFAULT true,
        triggered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Alerts table ready');

    // Notifications table — log of all sent notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        alert_id INTEGER REFERENCES alerts(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        channels VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Notifications table ready');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_analysis (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
        risk_score INTEGER,
        risk_level VARCHAR(20),
        sector_exposure JSONB,
        red_flags JSONB,
        suggestions JSONB,
        ai_reasoning TEXT,
        raw_response JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ AI analysis table ready');

    console.log('✅ All tables ready');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

createTables();
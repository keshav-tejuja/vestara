const { pool } = require('../config/db');

const PriceHistory = {

    // Store a single price data point
    async store({ symbol, price, volume, changePercent }) {
        await pool.query(
            `INSERT INTO price_history 
        (symbol, price, volume, change_percent)
       VALUES ($1, $2, $3, $4)`,
            [symbol, price, volume || null, changePercent || null]
        );
    },

    // Store multiple price points at once (bulk insert)
    async storeBulk(priceDataArray) {
        if (!priceDataArray || priceDataArray.length === 0) return;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const data of priceDataArray) {
                await client.query(
                    `INSERT INTO price_history 
            (symbol, price, volume, change_percent)
           VALUES ($1, $2, $3, $4)`,
                    [data.symbol, data.price, data.volume || null, data.changePercent || null]
                );
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Get price history for a symbol over N days
    async getHistory(symbol, days = 30) {
        const result = await pool.query(
            `SELECT 
        symbol,
        price,
        volume,
        change_percent,
        fetched_at,
        DATE(fetched_at) as date
       FROM price_history
       WHERE symbol = $1
       AND fetched_at > NOW() - INTERVAL '${days} days'
       ORDER BY fetched_at ASC`,
            [symbol]
        );
        return result.rows;
    },

    // Get ONE price per day (closing price approximation)
    // Uses the LAST price recorded each day
    async getDailyPrices(symbol, days = 30) {
        const result = await pool.query(
            `SELECT DISTINCT ON (DATE(fetched_at))
        DATE(fetched_at) as date,
        price,
        volume,
        change_percent,
        fetched_at
       FROM price_history
       WHERE symbol = $1
       AND fetched_at > NOW() - INTERVAL '${days} days'
       ORDER BY DATE(fetched_at), fetched_at DESC`,
            [symbol]
        );
        return result.rows;
    },

    // Get 30-day average volume for a symbol
    // Used by volume spike detection in alert service
    async getAverageVolume(symbol, days = 30) {
        const result = await pool.query(
            `SELECT AVG(volume) as avg_volume
       FROM price_history
       WHERE symbol = $1
       AND fetched_at > NOW() - INTERVAL '${days} days'
       AND volume IS NOT NULL`,
            [symbol]
        );
        return parseFloat(result.rows[0]?.avg_volume) || null;
    },

    // Calculate volatility (standard deviation of daily returns)
    async getVolatility(symbol, days = 30) {
        const result = await pool.query(
            `WITH daily_prices AS (
        SELECT DISTINCT ON (DATE(fetched_at))
          DATE(fetched_at) as date,
          price
        FROM price_history
        WHERE symbol = $1
        AND fetched_at > NOW() - INTERVAL '${days} days'
        ORDER BY DATE(fetched_at), fetched_at DESC
      ),
      daily_returns AS (
        SELECT 
          date,
          price,
          LAG(price) OVER (ORDER BY date) as prev_price,
          (price - LAG(price) OVER (ORDER BY date)) / 
          LAG(price) OVER (ORDER BY date) * 100 as daily_return
        FROM daily_prices
      )
      SELECT 
        STDDEV(daily_return) as volatility,
        AVG(daily_return) as avg_return,
        COUNT(*) as data_points
      FROM daily_returns
      WHERE daily_return IS NOT NULL`,
            [symbol]
        );

        return {
            volatility: parseFloat(result.rows[0]?.volatility?.toFixed(2)) || 0,
            avg_daily_return: parseFloat(result.rows[0]?.avg_return?.toFixed(2)) || 0,
            data_points: parseInt(result.rows[0]?.data_points) || 0
        };
    },

    // Store portfolio value snapshot
    async storePortfolioSnapshot({ portfolioId, totalInvested, totalValue, totalPnl, pnlPercent }) {
        await pool.query(
            `INSERT INTO portfolio_history
        (portfolio_id, total_invested, total_value, total_pnl, pnl_percent)
       VALUES ($1, $2, $3, $4, $5)`,
            [portfolioId, totalInvested, totalValue, totalPnl, pnlPercent]
        );
    },

    // Get portfolio value over time
    async getPortfolioHistory(portfolioId, days = 30) {
        const result = await pool.query(
            `SELECT DISTINCT ON (DATE(recorded_at))
        DATE(recorded_at) as date,
        total_invested,
        total_value,
        total_pnl,
        pnl_percent,
        recorded_at
       FROM portfolio_history
       WHERE portfolio_id = $1
       AND recorded_at > NOW() - INTERVAL '${days} days'
       ORDER BY DATE(recorded_at), recorded_at DESC`,
            [portfolioId]
        );
        return result.rows;
    },

    // Get weekly performance
    // Compares current value to value 7 days ago
    async getWeeklyPerformance(portfolioId) {
        const result = await pool.query(
            `WITH current_val AS (
        SELECT total_value, total_pnl, pnl_percent
        FROM portfolio_history
        WHERE portfolio_id = $1
        ORDER BY recorded_at DESC
        LIMIT 1
      ),
      week_ago_val AS (
        SELECT total_value
        FROM portfolio_history
        WHERE portfolio_id = $1
        AND recorded_at <= NOW() - INTERVAL '7 days'
        ORDER BY recorded_at DESC
        LIMIT 1
      )
      SELECT 
        current_val.total_value as current_value,
        week_ago_val.total_value as week_ago_value,
        current_val.total_pnl,
        current_val.pnl_percent,
        CASE 
          WHEN week_ago_val.total_value IS NOT NULL
          THEN ((current_val.total_value - week_ago_val.total_value) / 
                week_ago_val.total_value * 100)
          ELSE 0
        END as weekly_change_percent
      FROM current_val, week_ago_val`,
            [portfolioId]
        );
        return result.rows[0] || null;
    }
};

module.exports = PriceHistory;
const { pool } = require('../config/db');

const Portfolio = {

    // Create a new portfolio for user
    async create(userId, name = 'My Portfolio') {
        const result = await pool.query(
            `INSERT INTO portfolios (user_id, name)
       VALUES ($1, $2)
       RETURNING *`,
            [userId, name]
        );
        return result.rows[0];
    },

    // Find portfolio by user ID
    async findByUserId(userId) {
        const result = await pool.query(
            `SELECT * FROM portfolios WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0];
    },

    // Delete existing holdings before re-upload
    // (user uploads fresh CSV → replace old data)
    async deleteHoldings(portfolioId) {
        await pool.query(
            `DELETE FROM holdings WHERE portfolio_id = $1`,
            [portfolioId]
        );
    },

    // Insert all holdings at once using a transaction
    // Transaction = all inserts succeed together or all fail together
    async insertHoldings(portfolioId, holdings) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN'); // start transaction

            const insertedHoldings = [];

            for (const holding of holdings) {
                const result = await client.query(
                    `INSERT INTO holdings 
            (portfolio_id, symbol, company_name, quantity, avg_cost)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
                    [
                        portfolioId,
                        holding.symbol,
                        holding.company_name,
                        holding.quantity,
                        holding.avg_cost
                    ]
                );
                insertedHoldings.push(result.rows[0]);
            }

            await client.query('COMMIT'); // save all inserts
            return insertedHoldings;

        } catch (error) {
            await client.query('ROLLBACK'); // undo everything if any insert fails
            throw error;
        } finally {
            client.release(); // return connection to pool
        }
    },

    // Get portfolio with all its holdings
    async getWithHoldings(portfolioId) {
        const portfolioResult = await pool.query(
            `SELECT * FROM portfolios WHERE id = $1`,
            [portfolioId]
        );

        const holdingsResult = await pool.query(
            `SELECT * FROM holdings 
       WHERE portfolio_id = $1
       ORDER BY symbol ASC`,
            [portfolioId]
        );

        return {
            portfolio: portfolioResult.rows[0],
            holdings: holdingsResult.rows
        };
    },

    // Update portfolio timestamp when re-uploaded
    async updateTimestamp(portfolioId) {
        await pool.query(
            `UPDATE portfolios SET updated_at = NOW() WHERE id = $1`,
            [portfolioId]
        );
    }
};

module.exports = Portfolio;
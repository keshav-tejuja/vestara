const { pool } = require('../config/db');

const Analysis = {

    // Save analysis to DB
    async save({
        portfolioId,
        riskScore,
        riskLevel,
        sectorExposure,
        redFlags,
        suggestions,
        aiReasoning,
        rawResponse
    }) {
        const result = await pool.query(
            `INSERT INTO ai_analysis
        (portfolio_id, risk_score, risk_level, sector_exposure, 
         red_flags, suggestions, ai_reasoning, raw_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
            [
                portfolioId,
                riskScore,
                riskLevel,
                JSON.stringify(sectorExposure),
                JSON.stringify(redFlags),
                JSON.stringify(suggestions),
                aiReasoning,
                JSON.stringify(rawResponse)
            ]
        );
        return result.rows[0];
    },

    // Get latest analysis for a portfolio
    async getLatest(portfolioId) {
        const result = await pool.query(
            `SELECT * FROM ai_analysis
       WHERE portfolio_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
            [portfolioId]
        );
        return result.rows[0];
    },

    // Get analysis history
    async getHistory(portfolioId) {
        const result = await pool.query(
            `SELECT id, risk_score, risk_level, created_at
       FROM ai_analysis
       WHERE portfolio_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
            [portfolioId]
        );
        return result.rows;
    }
};

module.exports = Analysis;
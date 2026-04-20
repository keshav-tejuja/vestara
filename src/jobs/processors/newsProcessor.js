const { pool } = require('../../config/db');
const { fetchNewsForPortfolio } = require('../../services/newsService');

const newsProcessor = async (job) => {
    console.log(`📰 Processing news job #${job.id}`);

    try {
        // Get all unique symbols across all portfolios
        const result = await pool.query(
            `SELECT DISTINCT symbol FROM holdings`
        );

        const symbols = result.rows.map(r => r.symbol);

        if (symbols.length === 0) {
            console.log('No symbols found for news fetch');
            return { fetched: 0 };
        }

        console.log(`📰 Fetching news for ${symbols.length} symbols: ${symbols.join(', ')}`);

        // Fetch news for all symbols
        const allNews = await fetchNewsForPortfolio(symbols);

        // Count how many articles were fetched
        const totalArticles = Object.values(allNews)
            .reduce((sum, articles) => sum + articles.length, 0);

        // Update job progress
        await job.updateProgress(100);

        console.log(`✅ News job done — ${totalArticles} articles fetched for ${symbols.length} symbols`);

        return {
            symbols_processed: symbols.length,
            total_articles: totalArticles
        };

    } catch (error) {
        console.error('News processor failed:', error.message);
        throw error;
    }
};

module.exports = newsProcessor;
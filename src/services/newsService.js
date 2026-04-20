const axios = require('axios');
const redis = require('../config/redis');
const { pool } = require('../config/db');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Map stock symbols to full company names for better news search
const symbolToCompany = {
    'RELIANCE': 'Reliance Industries',
    'INFY': 'Infosys',
    'TCS': 'Tata Consultancy Services',
    'HDFCBANK': 'HDFC Bank',
    'WIPRO': 'Wipro',
    'ICICIBANK': 'ICICI Bank',
    'SBIN': 'State Bank of India',
    'KOTAKBANK': 'Kotak Mahindra Bank',
    'AXISBANK': 'Axis Bank',
    'HINDUNILVR': 'Hindustan Unilever',
    'ITC': 'ITC Limited',
    'TATAMOTORS': 'Tata Motors',
    'MARUTI': 'Maruti Suzuki',
    'SUNPHARMA': 'Sun Pharmaceutical',
    'BAJFINANCE': 'Bajaj Finance',
    'NTPC': 'NTPC Limited',
    'ONGC': 'ONGC',
    'BHARTIARTL': 'Bharti Airtel',
    'TATASTEEL': 'Tata Steel',
    'ADANIGREEN': 'Adani Green Energy'
};

const getCompanyName = (symbol) => {
    return symbolToCompany[symbol.toUpperCase()] || symbol;
};

// Analyze sentiment of a news headline using Groq
const analyzeSentiment = async (headlines) => {
    try {
        const prompt = `
Analyze the sentiment of these financial news headlines for an Indian stock.
Return ONLY a valid JSON array — no markdown, no backticks, no extra text.

Headlines:
${headlines.map((h, i) => `${i + 1}. "${h.title}"`).join('\n')}

Return this exact format:
[
  {
    "index": 1,
    "sentiment": "positive/negative/neutral",
    "sentiment_score": 0.8,
    "summary": "one line explanation of what this means for the stock"
  }
]

Rules:
- sentiment_score: 0.0 to 1.0 (1.0 = very positive, 0.0 = very negative, 0.5 = neutral)
- summary: max 15 words, plain English, focused on stock impact
`;

        const completion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama3-70b-8192',
            messages: [
                {
                    role: 'system',
                    content: 'You are a financial news analyst. Always respond with valid JSON array only.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            max_tokens: 800
        });

        const responseText = completion.choices[0].message.content.trim();
        const cleaned = responseText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        return JSON.parse(cleaned);

    } catch (error) {
        console.error('Sentiment analysis failed:', error.message);
        // Return neutral sentiment as fallback
        return headlines.map((_, i) => ({
            index: i + 1,
            sentiment: 'neutral',
            sentiment_score: 0.5,
            summary: 'Unable to analyze sentiment'
        }));
    }
};

// Fetch news for a single stock
const fetchNewsForSymbol = async (symbol) => {
    const cacheKey = `news:${symbol}`;

    try {
        // 1. Check Redis cache first (30 min TTL)
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`📰 News cache hit for ${symbol}`);
            return JSON.parse(cached);
        }

        // 2. Build search query
        const companyName = getCompanyName(symbol);
        const query = encodeURIComponent(`${companyName} stock`);
        const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=in&max=5&apikey=${process.env.GNEWS_API_KEY}`;

        console.log(`📰 Fetching news for ${symbol} (${companyName})`);
        const response = await axios.get(url, { timeout: 10000 });

        const articles = response.data?.articles || [];

        if (articles.length === 0) {
            console.log(`No news found for ${symbol}`);
            return [];
        }

        // 3. Analyze sentiment using Groq AI
        const sentiments = await analyzeSentiment(articles);

        // 4. Combine news + sentiment
        const newsItems = articles.map((article, index) => {
            const sentiment = sentiments.find(s => s.index === index + 1) || {
                sentiment: 'neutral',
                sentiment_score: 0.5,
                summary: ''
            };

            return {
                symbol,
                headline: article.title,
                description: article.description,
                url: article.url,
                source: article.source?.name || 'Unknown',
                sentiment: sentiment.sentiment,
                sentiment_score: sentiment.sentiment_score,
                ai_summary: sentiment.summary,
                published_at: article.publishedAt
            };
        });

        // 5. Store in PostgreSQL
        await storeNewsInDB(newsItems);

        // 6. Cache in Redis for 30 minutes
        await redis.setex(cacheKey, 1800, JSON.stringify(newsItems));

        return newsItems;

    } catch (error) {
        console.error(`News fetch failed for ${symbol}:`, error.message);

        // Try to return stale DB data if API fails
        const staleNews = await getNewsFromDB(symbol, 24); // last 24 hours
        if (staleNews.length > 0) {
            console.log(`Returning stale news for ${symbol}`);
            return staleNews;
        }

        return [];
    }
};

// Store news articles in PostgreSQL
const storeNewsInDB = async (newsItems) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const item of newsItems) {
            // Use ON CONFLICT to avoid duplicate headlines
            await client.query(
                `INSERT INTO news_cache 
          (symbol, headline, description, url, source, 
           sentiment, sentiment_score, ai_summary, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
                [
                    item.symbol,
                    item.headline,
                    item.description,
                    item.url,
                    item.source,
                    item.sentiment,
                    item.sentiment_score,
                    item.ai_summary,
                    item.published_at
                ]
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to store news:', error.message);
    } finally {
        client.release();
    }
};

// Get news from DB for a symbol
const getNewsFromDB = async (symbol, hoursBack = 24) => {
    const result = await pool.query(
        `SELECT * FROM news_cache
     WHERE symbol = $1
     AND fetched_at > NOW() - INTERVAL '${hoursBack} hours'
     ORDER BY published_at DESC
     LIMIT 10`,
        [symbol]
    );
    return result.rows;
};

// Fetch news for multiple symbols
const fetchNewsForPortfolio = async (symbols) => {
    const allNews = {};

    // Process symbols sequentially to respect API rate limits
    // GNews free tier = 100 req/day so be careful
    for (const symbol of symbols) {
        try {
            const news = await fetchNewsForSymbol(symbol);
            allNews[symbol] = news;
            // Small delay between requests to be respectful to the API
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Failed news for ${symbol}:`, error.message);
            allNews[symbol] = [];
        }
    }

    return allNews;
};

// Get overall portfolio sentiment
// Useful for dashboard summary
const getPortfolioSentiment = (allNews) => {
    let totalScore = 0;
    let count = 0;
    const symbolSentiments = {};

    for (const [symbol, newsItems] of Object.entries(allNews)) {
        if (newsItems.length === 0) continue;

        const avgScore = newsItems.reduce((sum, n) => sum + parseFloat(n.sentiment_score || 0.5), 0) / newsItems.length;
        symbolSentiments[symbol] = {
            score: parseFloat(avgScore.toFixed(2)),
            sentiment: avgScore > 0.6 ? 'positive' : avgScore < 0.4 ? 'negative' : 'neutral',
            article_count: newsItems.length
        };

        totalScore += avgScore;
        count++;
    }

    const overallScore = count > 0 ? totalScore / count : 0.5;

    return {
        overall_score: parseFloat(overallScore.toFixed(2)),
        overall_sentiment: overallScore > 0.6 ? 'positive' : overallScore < 0.4 ? 'negative' : 'neutral',
        by_symbol: symbolSentiments
    };
};

module.exports = {
    fetchNewsForSymbol,
    fetchNewsForPortfolio,
    getNewsFromDB,
    getPortfolioSentiment
};
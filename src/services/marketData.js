const axios = require('axios');
const redis = require('../config/redis');

const formatSymbol = (symbol) => {
    if (symbol.includes('.')) return symbol;
    return `${symbol}.NS`;
};

const getStockPrice = async (symbol) => {
    const formattedSymbol = formatSymbol(symbol);
    const cacheKey = `price:${symbol}`;

    try {
        // Check Redis cache first
        const cachedPrice = await redis.get(cacheKey);
        if (cachedPrice) {
            return JSON.parse(cachedPrice);
        }

        // Fetch from Yahoo Finance directly via URL
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1d&range=1d`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const result = response.data?.chart?.result?.[0];
        if (!result) throw new Error(`No data found for ${symbol}`);

        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose || meta.chartPreviousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        const priceData = {
            symbol,
            currentPrice,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: meta.regularMarketVolume,
            high: meta.regularMarketDayHigh,
            low: meta.regularMarketDayLow,
            previousClose,
            lastUpdated: new Date().toISOString()
        };

        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(priceData));

        return priceData;

    } catch (error) {
        const staleCache = await redis.get(`stale:${cacheKey}`);
        if (staleCache) {
            return { ...JSON.parse(staleCache), isStale: true };
        }
        throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
    }
};

const getBulkPrices = async (symbols) => {
    const results = await Promise.allSettled(
        symbols.map(symbol => getStockPrice(symbol))
    );

    const prices = {};
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            prices[symbols[index]] = result.value;
        } else {
            prices[symbols[index]] = null;
            console.error(`Failed to fetch ${symbols[index]}:`, result.reason.message);
        }
    });

    return prices;
};

const isMarketOpen = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const day = istTime.getUTCDay();
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const timeInMinutes = hours * 60 + minutes;
    if (day === 0 || day === 6) return false;
    return timeInMinutes >= 555 && timeInMinutes <= 930;
};

module.exports = { getStockPrice, getBulkPrices, isMarketOpen };
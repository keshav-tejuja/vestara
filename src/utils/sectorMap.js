// NSE stock to sector mapping
// This is a static lookup — covers most common stocks
const sectorMap = {
    // IT
    'TCS': 'Information Technology',
    'INFY': 'Information Technology',
    'WIPRO': 'Information Technology',
    'HCLTECH': 'Information Technology',
    'TECHM': 'Information Technology',
    'LTIM': 'Information Technology',
    'MPHASIS': 'Information Technology',
    'COFORGE': 'Information Technology',
    'PERSISTENT': 'Information Technology',

    // Banking & Finance
    'HDFCBANK': 'Banking & Finance',
    'ICICIBANK': 'Banking & Finance',
    'SBIN': 'Banking & Finance',
    'KOTAKBANK': 'Banking & Finance',
    'AXISBANK': 'Banking & Finance',
    'INDUSINDBK': 'Banking & Finance',
    'BAJFINANCE': 'Banking & Finance',
    'BAJAJFINSV': 'Banking & Finance',
    'HDFC': 'Banking & Finance',

    // Energy & Oil
    'RELIANCE': 'Energy & Oil',
    'ONGC': 'Energy & Oil',
    'BPCL': 'Energy & Oil',
    'IOC': 'Energy & Oil',
    'NTPC': 'Energy & Oil',
    'POWERGRID': 'Energy & Oil',
    'ADANIGREEN': 'Energy & Oil',
    'ADANIPORTS': 'Energy & Oil',

    // FMCG
    'HINDUNILVR': 'FMCG',
    'ITC': 'FMCG',
    'NESTLEIND': 'FMCG',
    'BRITANNIA': 'FMCG',
    'DABUR': 'FMCG',
    'MARICO': 'FMCG',
    'GODREJCP': 'FMCG',

    // Pharma
    'SUNPHARMA': 'Pharma',
    'DRREDDY': 'Pharma',
    'CIPLA': 'Pharma',
    'DIVISLAB': 'Pharma',
    'BIOCON': 'Pharma',
    'AUROPHARMA': 'Pharma',

    // Auto
    'MARUTI': 'Automobile',
    'TATAMOTORS': 'Automobile',
    'M&M': 'Automobile',
    'BAJAJ-AUTO': 'Automobile',
    'HEROMOTOCO': 'Automobile',
    'EICHERMOT': 'Automobile',

    // Metals & Mining
    'TATASTEEL': 'Metals & Mining',
    'JSWSTEEL': 'Metals & Mining',
    'HINDALCO': 'Metals & Mining',
    'VEDL': 'Metals & Mining',
    'COALINDIA': 'Metals & Mining',

    // Telecom
    'BHARTIARTL': 'Telecom',
    'IDEA': 'Telecom',

    // Cement
    'ULTRACEMCO': 'Cement',
    'SHREECEM': 'Cement',
    'AMBUJACEM': 'Cement',
    'ACC': 'Cement',

    // Consumer Durables
    'TITAN': 'Consumer Durables',
    'HAVELLS': 'Consumer Durables',
    'VOLTAS': 'Consumer Durables',
};

const getSector = (symbol) => {
    return sectorMap[symbol.toUpperCase()] || 'Others';
};

// Calculate sector exposure percentages
const calculateSectorExposure = (holdings, prices) => {
    let totalValue = 0;
    const sectorValues = {};

    for (const holding of holdings) {
        const price = prices[holding.symbol];
        if (!price) continue;

        const currentValue = parseFloat(holding.quantity) * price.currentPrice;
        const sector = getSector(holding.symbol);

        totalValue += currentValue;
        sectorValues[sector] = (sectorValues[sector] || 0) + currentValue;
    }

    // Convert to percentages
    const sectorExposure = {};
    for (const [sector, value] of Object.entries(sectorValues)) {
        sectorExposure[sector] = parseFloat(((value / totalValue) * 100).toFixed(2));
    }

    return sectorExposure;
};

module.exports = { getSector, calculateSectorExposure };
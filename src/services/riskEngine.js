const { calculateSectorExposure, getSector } = require('../utils/sectorMap');

// Calculate concentration risk per stock
const calculateConcentrationRisk = (holdings, prices) => {
    let totalValue = 0;
    const stockValues = {};

    for (const holding of holdings) {
        const price = prices[holding.symbol];
        if (!price) continue;
        const value = parseFloat(holding.quantity) * price.currentPrice;
        totalValue += value;
        stockValues[holding.symbol] = value;
    }

    const concentrations = {};
    for (const [symbol, value] of Object.entries(stockValues)) {
        concentrations[symbol] = parseFloat(((value / totalValue) * 100).toFixed(2));
    }

    return concentrations;
};

// Calculate overall risk score 0-100
// Higher = more risky
const calculateRiskScore = (sectorExposure, concentrations, totalHoldings) => {
    let score = 0;

    // Factor 1 — Sector concentration (max 40 points)
    const maxSectorExposure = Math.max(...Object.values(sectorExposure));
    if (maxSectorExposure > 60) score += 40;
    else if (maxSectorExposure > 40) score += 25;
    else if (maxSectorExposure > 25) score += 15;
    else score += 5;

    // Factor 2 — Single stock concentration (max 30 points)
    const maxStockConcentration = Math.max(...Object.values(concentrations));
    if (maxStockConcentration > 40) score += 30;
    else if (maxStockConcentration > 25) score += 20;
    else if (maxStockConcentration > 15) score += 10;
    else score += 3;

    // Factor 3 — Number of holdings (max 20 points)
    // Fewer stocks = less diversified = more risk
    if (totalHoldings < 3) score += 20;
    else if (totalHoldings < 5) score += 15;
    else if (totalHoldings < 8) score += 10;
    else if (totalHoldings < 12) score += 5;
    else score += 0;

    // Factor 4 — Number of sectors (max 10 points)
    const totalSectors = Object.keys(sectorExposure).length;
    if (totalSectors < 2) score += 10;
    else if (totalSectors < 3) score += 7;
    else if (totalSectors < 4) score += 4;
    else score += 0;

    return Math.min(score, 100); // cap at 100
};

const getRiskLevel = (score) => {
    if (score >= 75) return 'High';
    if (score >= 50) return 'Medium-High';
    if (score >= 25) return 'Medium';
    return 'Low';
};

// Identify red flags
const identifyRedFlags = (sectorExposure, concentrations, totalHoldings) => {
    const flags = [];

    // Check sector concentration
    for (const [sector, percent] of Object.entries(sectorExposure)) {
        if (percent > 50) {
            flags.push(`${percent}% of portfolio is in ${sector} — extremely high sector concentration`);
        } else if (percent > 35) {
            flags.push(`${percent}% concentration in ${sector} sector — consider reducing exposure`);
        }
    }

    // Check single stock concentration
    for (const [symbol, percent] of Object.entries(concentrations)) {
        if (percent > 30) {
            flags.push(`${symbol} alone is ${percent}% of your portfolio — single stock risk is very high`);
        } else if (percent > 20) {
            flags.push(`${symbol} is ${percent}% of portfolio — monitor closely`);
        }
    }

    // Check diversification
    if (totalHoldings < 5) {
        flags.push(`Only ${totalHoldings} stocks — portfolio needs more diversification`);
    }

    if (Object.keys(sectorExposure).length < 3) {
        flags.push('Portfolio spread across fewer than 3 sectors — add defensive sectors like FMCG or Pharma');
    }

    return flags;
};

// Full risk calculation
const calculateRisk = (holdings, prices) => {
    const sectorExposure = calculateSectorExposure(holdings, prices);
    const concentrations = calculateConcentrationRisk(holdings, prices);
    const riskScore = calculateRiskScore(sectorExposure, concentrations, holdings.length);
    const riskLevel = getRiskLevel(riskScore);
    const redFlags = identifyRedFlags(sectorExposure, concentrations, holdings.length);

    return {
        riskScore,
        riskLevel,
        sectorExposure,
        concentrations,
        redFlags
    };
};

module.exports = { calculateRisk };
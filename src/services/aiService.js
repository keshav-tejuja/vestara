const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Generate AI portfolio analysis
const analyzePortfolio = async ({
    holdings,
    prices,
    riskScore,
    riskLevel,
    sectorExposure,
    concentrations,
    redFlags,
    totalInvested,
    totalCurrentValue,
    totalPnL,
    totalPnLPercent
}) => {
    // Build portfolio summary for AI
    const holdingsSummary = holdings.map(h => {
        const price = prices[h.symbol];
        const currentValue = price
            ? (parseFloat(h.quantity) * price.currentPrice).toFixed(2)
            : 'N/A';
        const pnl = price
            ? ((price.currentPrice - parseFloat(h.avg_cost)) * parseFloat(h.quantity)).toFixed(2)
            : 'N/A';

        return {
            symbol: h.symbol,
            company: h.company_name,
            quantity: h.quantity,
            avg_cost: h.avg_cost,
            current_price: price?.currentPrice || 'N/A',
            current_value: currentValue,
            pnl,
            concentration: `${concentrations[h.symbol] || 0}%`
        };
    });

    const prompt = `
You are a SEBI-registered investment advisor analyzing an Indian retail investor's stock portfolio.

PORTFOLIO SUMMARY:
- Total Invested: ₹${totalInvested}
- Current Value: ₹${totalCurrentValue}
- Total P&L: ₹${totalPnL} (${totalPnLPercent}%)
- Risk Score: ${riskScore}/100
- Risk Level: ${riskLevel}

HOLDINGS:
${JSON.stringify(holdingsSummary, null, 2)}

SECTOR EXPOSURE:
${JSON.stringify(sectorExposure, null, 2)}

RED FLAGS IDENTIFIED:
${redFlags.length > 0 ? redFlags.join('\n') : 'None'}

Based on this analysis, provide a detailed portfolio assessment. Be specific, actionable, and use simple language that a retail investor can understand.

Respond ONLY with a valid JSON object in this exact format (no markdown, no backticks):
{
  "overall_assessment": "2-3 sentence summary of the portfolio's health",
  "risk_reasoning": "Explain why the risk score is ${riskScore} in 2-3 sentences",
  "top_concerns": ["concern 1", "concern 2", "concern 3"],
  "suggestions": [
    {
      "action": "specific action to take",
      "reason": "why this helps",
      "priority": "high/medium/low"
    }
  ],
  "positive_aspects": ["what's good about this portfolio"],
  "market_context": "Brief context about current Indian market conditions relevant to these holdings"
}
`;

    try {
        const completion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama3-70b-8192',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional investment advisor. Always respond with valid JSON only. No markdown, no backticks, no extra text.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3, // lower = more consistent, less creative
            max_tokens: 1500
        });

        const responseText = completion.choices[0].message.content.trim();

        // Clean response — remove any accidental backticks
        const cleaned = responseText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        const parsed = JSON.parse(cleaned);
        return parsed;

    } catch (error) {
        console.error('Groq AI error:', error.message);

        // Return fallback analysis if AI fails
        return {
            overall_assessment: `Portfolio has a risk score of ${riskScore}/100 (${riskLevel}). Manual review recommended.`,
            risk_reasoning: `Risk calculated based on sector concentration and stock diversification.`,
            top_concerns: redFlags.slice(0, 3),
            suggestions: [
                {
                    action: 'Review sector concentration',
                    reason: 'Concentrated portfolios carry higher risk',
                    priority: 'high'
                }
            ],
            positive_aspects: ['Portfolio data successfully analyzed'],
            market_context: 'Please consult a financial advisor for current market context.'
        };
    }
};

// Generate weekly report summary
const generateWeeklyReport = async ({ userName, portfolioSummary, weeklyChange }) => {
    const prompt = `
Generate a brief, friendly weekly portfolio report for ${userName}.

Portfolio this week:
${JSON.stringify(portfolioSummary, null, 2)}

Weekly change: ${weeklyChange}%

Write a 3-4 sentence summary that:
1. Mentions overall performance
2. Highlights the best and worst performing stock
3. Gives one actionable tip for next week

Keep it conversational and encouraging. Respond with plain text, no JSON.
`;

    try {
        const completion = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama3-70b-8192',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 300
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('Weekly report AI error:', error.message);
        return `Weekly portfolio update: Your portfolio changed by ${weeklyChange}% this week.`;
    }
};

module.exports = { analyzePortfolio, generateWeeklyReport };
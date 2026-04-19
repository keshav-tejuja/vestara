const { pool } = require('../../config/db');
const { runAnalysis } = require('../../controllers/analysisController');
const { generateWeeklyReport } = require('../../services/aiService');
const { sendAlertNotification } = require('../../services/notificationService');

const reportProcessor = async (job) => {
    console.log(`📊 Running weekly report job #${job.id}`);

    try {
        // Get all users with portfolios
        const result = await pool.query(`
      SELECT p.id as portfolio_id, p.user_id, u.name, u.email
      FROM portfolios p
      JOIN users u ON u.id = p.user_id
      JOIN holdings h ON h.portfolio_id = p.id
      GROUP BY p.id, p.user_id, u.name, u.email
    `);

        const portfolios = result.rows;
        console.log(`📊 Generating reports for ${portfolios.length} users`);

        for (const { portfolio_id, user_id, name, email } of portfolios) {
            try {
                // Run full AI analysis
                const analysis = await runAnalysis(portfolio_id);

                // Generate friendly weekly summary
                const weeklySummary = await generateWeeklyReport({
                    userName: name,
                    portfolioSummary: {
                        risk_score: analysis.risk_score,
                        risk_level: analysis.risk_level,
                        sector_exposure: analysis.sector_exposure
                    },
                    weeklyChange: 0 // will be real data in iteration 9
                });

                // Send email report
                await sendAlertNotification({
                    userId: user_id,
                    alertId: null,
                    userEmail: email,
                    userPhone: null,
                    userName: name,
                    symbol: 'PORTFOLIO',
                    title: '📊 Your Weekly Vestara Portfolio Report',
                    message: weeklySummary,
                    emailHtml: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">📊 Weekly Portfolio Report</h1>
              </div>
              <div style="padding: 24px; background: #f8fafc; border-radius: 0 0 8px 8px;">
                <p>Hi ${name},</p>
                <p>${weeklySummary}</p>
                <hr/>
                <h3>Risk Assessment</h3>
                <p>Risk Score: <strong>${analysis.risk_score}/100</strong> (${analysis.risk_level})</p>
                <h3>Top Concerns</h3>
                <ul>
                  ${analysis.red_flags.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <h3>AI Suggestions</h3>
                <ul>
                  ${(analysis.ai_insights?.suggestions || []).map(s =>
                        `<li><strong>${s.action}</strong> — ${s.reason}</li>`
                    ).join('')}
                </ul>
                <p style="color: #64748b; font-size: 12px;">
                  This is an automated report from Vestara. Not financial advice.
                </p>
              </div>
            </div>
          `,
                    notificationType: 'weekly_report'
                });

                await job.updateProgress(
                    Math.round(((portfolios.indexOf({ portfolio_id }) + 1) / portfolios.length) * 100)
                );

            } catch (error) {
                console.error(`Report failed for user ${user_id}:`, error.message);
            }
        }

        return { processed: portfolios.length };

    } catch (error) {
        console.error('Report job failed:', error.message);
        throw error;
    }
};

module.exports = reportProcessor;
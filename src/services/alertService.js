const Alert = require('../models/alert');
const { pool } = require('../config/db');
const {
    sendAlertNotification,
    buildPriceAlertEmail,
    buildVolumeAlertEmail
} = require('./notificationService');

// Check price alerts against current prices
const checkPriceAlerts = async (prices) => {
    // prices = { RELIANCE: { currentPrice: 1365, ... }, INFY: { ... } }

    try {
        const activeAlerts = await Alert.getAllActiveAlerts();

        if (activeAlerts.length === 0) return;

        console.log(`🔍 Checking ${activeAlerts.length} price alerts`);

        for (const alert of activeAlerts) {
            const priceData = prices[alert.symbol];
            if (!priceData) continue;

            const currentPrice = priceData.currentPrice;
            const targetPrice = parseFloat(alert.target_price);
            let shouldTrigger = false;

            // Check condition
            if (alert.condition === 'above' && currentPrice >= targetPrice) {
                shouldTrigger = true;
            } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
                shouldTrigger = true;
            }

            if (!shouldTrigger) continue;

            console.log(`🔔 Alert triggered: ${alert.symbol} ${alert.condition} ₹${targetPrice}`);

            // Get user's P&L for this stock
            const holdingResult = await pool.query(
                `SELECT h.*, p.user_id
         FROM holdings h
         JOIN portfolios p ON p.id = h.portfolio_id
         WHERE p.user_id = $1 AND h.symbol = $2`,
                [alert.user_id, alert.symbol]
            );

            const holding = holdingResult.rows[0];
            const pnl = holding
                ? ((currentPrice - parseFloat(holding.avg_cost)) * parseFloat(holding.quantity)).toFixed(2)
                : 0;

            const title = `🔔 ${alert.symbol} Alert Triggered`;
            const message = `${alert.symbol} is now ₹${currentPrice} (${alert.condition} your target of ₹${targetPrice})`;

            // Send notification
            await sendAlertNotification({
                userId: alert.user_id,
                alertId: alert.id,
                userEmail: alert.email,
                userPhone: alert.phone,
                userName: alert.name,
                symbol: alert.symbol,
                title,
                message,
                emailHtml: buildPriceAlertEmail({
                    name: alert.name,
                    symbol: alert.symbol,
                    condition: alert.condition,
                    targetPrice,
                    currentPrice,
                    pnl
                }),
                notificationType: 'price_alert'
            });

            // Deactivate alert so it doesn't trigger again
            await Alert.markTriggered(alert.id);
        }

    } catch (error) {
        console.error('Price alert check failed:', error.message);
    }
};

// Check for unusual volume spikes
const checkVolumeSpikes = async (prices) => {
    try {
        // Get 30-day average volume per symbol from price_history
        // (We'll populate price_history in Iteration 9)
        // For now, use a simple multiplier check against today's data

        const volumeAlerts = await Alert.getAllActiveVolumeAlerts();

        for (const alert of volumeAlerts) {
            const priceData = prices[alert.symbol];
            if (!priceData || !priceData.volume) continue;

            // Get average volume from last 30 days if available
            const historyResult = await pool.query(
                `SELECT AVG(volume) as avg_volume
         FROM price_history
         WHERE symbol = $1
         AND fetched_at > NOW() - INTERVAL '30 days'`,
                [alert.symbol]
            );

            const avgVolume = parseFloat(historyResult.rows[0]?.avg_volume);
            if (!avgVolume) continue;

            const currentVolume = priceData.volume;
            const spikeThreshold = 2; // 2x normal volume = spike

            if (currentVolume < avgVolume * spikeThreshold) continue;

            console.log(`📊 Volume spike: ${alert.symbol} — ${(currentVolume / avgVolume).toFixed(1)}x normal`);

            const title = `📊 ${alert.symbol} Volume Spike Detected`;
            const message = `${alert.symbol} volume is ${(currentVolume / avgVolume).toFixed(1)}x above normal`;

            await sendAlertNotification({
                userId: alert.user_id,
                alertId: alert.id,
                userEmail: alert.email,
                userPhone: alert.phone,
                userName: alert.name,
                symbol: alert.symbol,
                title,
                message,
                emailHtml: buildVolumeAlertEmail({
                    name: alert.name,
                    symbol: alert.symbol,
                    currentVolume,
                    avgVolume: Math.round(avgVolume)
                }),
                notificationType: 'volume_alert'
            });

            await Alert.markTriggered(alert.id);
        }

    } catch (error) {
        console.error('Volume alert check failed:', error.message);
    }
};

module.exports = { checkPriceAlerts, checkVolumeSpikes };
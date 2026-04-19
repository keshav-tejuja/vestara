const { pool } = require('../config/db');

const Alert = {

    // Create new alert
    async create({ userId, symbol, alertType, condition, targetPrice }) {
        const result = await pool.query(
            `INSERT INTO alerts 
        (user_id, symbol, alert_type, condition, target_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [userId, symbol.toUpperCase(), alertType, condition, targetPrice]
        );
        return result.rows[0];
    },

    // Get all active alerts for a user
    async findByUserId(userId) {
        const result = await pool.query(
            `SELECT * FROM alerts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    },

    // Get ALL active price alerts across all users
    // Used by the alert checker in price processor
    async getAllActiveAlerts() {
        const result = await pool.query(
            `SELECT a.*, u.email, u.name, u.phone
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       WHERE a.is_active = true 
       AND a.alert_type = 'price'`
        );
        return result.rows;
    },

    // Get ALL active volume alerts across all users
    async getAllActiveVolumeAlerts() {
        const result = await pool.query(
            `SELECT a.*, u.email, u.name, u.phone
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       WHERE a.is_active = true 
       AND a.alert_type = 'volume'`
        );
        return result.rows;
    },

    // Mark alert as triggered
    // Once triggered, deactivate so it doesn't spam
    async markTriggered(alertId) {
        await pool.query(
            `UPDATE alerts 
       SET is_active = false, triggered_at = NOW()
       WHERE id = $1`,
            [alertId]
        );
    },

    // Delete alert
    async delete(alertId, userId) {
        const result = await pool.query(
            `DELETE FROM alerts 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [alertId, userId]
        );
        return result.rows[0];
    },

    // Log notification to DB
    async logNotification({ userId, alertId, title, message, type, channels }) {
        await pool.query(
            `INSERT INTO notifications 
        (user_id, alert_id, title, message, type, channels)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, alertId, title, message, type, channels]
        );
    },

    // Get notification history for user
    async getNotifications(userId) {
        const result = await pool.query(
            `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
            [userId]
        );
        return result.rows;
    }
};

module.exports = Alert;
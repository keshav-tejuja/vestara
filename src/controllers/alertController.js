const Alert = require('../models/alert');

// @route   POST /alerts
// @desc    Create a new alert
// @access  Private
const createAlert = async (req, res) => {
    try {
        const { symbol, alert_type, condition, target_price } = req.body;

        // Validate
        if (!symbol || !alert_type) {
            return res.status(400).json({
                error: 'Symbol and alert_type are required.'
            });
        }

        // Price alerts need condition and target
        if (alert_type === 'price') {
            if (!condition || !target_price) {
                return res.status(400).json({
                    error: 'Price alerts require condition (above/below) and target_price.'
                });
            }
            if (!['above', 'below'].includes(condition)) {
                return res.status(400).json({
                    error: 'Condition must be "above" or "below".'
                });
            }
        }

        const alert = await Alert.create({
            userId: req.user.id,
            symbol,
            alertType: alert_type,
            condition: condition || null,
            targetPrice: target_price || null
        });

        res.status(201).json({
            message: 'Alert created successfully.',
            alert
        });

    } catch (error) {
        console.error('Create alert error:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   GET /alerts
// @desc    Get all alerts for user
// @access  Private
const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.findByUserId(req.user.id);
        res.status(200).json({ alerts });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   DELETE /alerts/:id
// @desc    Delete an alert
// @access  Private
const deleteAlert = async (req, res) => {
    try {
        const deleted = await Alert.delete(req.params.id, req.user.id);

        if (!deleted) {
            return res.status(404).json({
                error: 'Alert not found or not yours.'
            });
        }

        res.status(200).json({ message: 'Alert deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// @route   GET /alerts/notifications
// @desc    Get notification history
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Alert.getNotifications(req.user.id);
        res.status(200).json({ notifications });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { createAlert, getAlerts, deleteAlert, getNotifications };
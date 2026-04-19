const express = require('express');
const router = express.Router();
const {
    createAlert,
    getAlerts,
    deleteAlert,
    getNotifications
} = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createAlert);
router.get('/', protect, getAlerts);
router.delete('/:id', protect, deleteAlert);
router.get('/notifications', protect, getNotifications);

module.exports = router;
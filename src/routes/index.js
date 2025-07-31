const express = require('express');
// const authenticated = require('../middlewares/auth.middleware');
const router = express.Router();

// Import route modules
const adminRoutes = require('./admin');
const userRoutes = require('./user');
const creatorRequestRoutes = require('./creatorRequest.route');
const notificationRoutes = require('./v1/notification.route');
const webhookRoutes = require('./webhook.route');

/**
 * GET v1/status
 */
router.get('/status', (req, res) => {
    res.json({ message: 'OK' });
});

// Admin routes
router.use('/admin', adminRoutes);

// User routes
router.use('/user', userRoutes);

// Creator request routes
router.use('/creator-requests', creatorRequestRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

router.use('/webhooks', webhookRoutes);

module.exports = router;

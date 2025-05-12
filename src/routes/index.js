const express = require('express');
// const authenticated = require('../middlewares/auth.middleware');
const router = express.Router();

// Import route modules
const adminRoutes = require('./admin');
const userRoutes = require('./user');
const creatorRequestRoutes = require('./creatorRequest.route');

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

module.exports = router;

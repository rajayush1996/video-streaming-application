const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.route');

// Import route modules
const uploadRoutes = require('./upload.route');
const blogRoutes = require('./blog.route');
const creatorRequestRoutes = require('../creatorRequest.route');
const userRoutes = require('./user.route');
const mediaMetaRoutes = require('./mediaMeta.route');
const reelsRoutes = require('./reels.route');

router.use('/auth', authRoutes);

// User profile routes
router.use('/profile', userRoutes);

// Creator request routes (available to all authenticated users)
router.use('/creator-requests', creatorRequestRoutes);

// Upload routes (only for creators)
router.use('/upload', uploadRoutes);

// Blog routes (public access for reading, creator access for writing)
router.use('/blog', blogRoutes);

// Media routes (public access)
router.use('/media', mediaMetaRoutes);

// Reels routes (public access)
router.use('/reels', reelsRoutes);

module.exports = router; 
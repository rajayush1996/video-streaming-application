const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.route');
const auth = require('../../middlewares/auth.middleware');


// Import route modules
const uploadRoutes = require('./upload.route');
const blogRoutes = require('./blog.route');
const creatorRequestRoutes = require('../creatorRequest.route');
const userRoutes = require('./user.route');
const mediaMetaRoutes = require('./mediaMeta.route');
const reelsRoutes = require('./reels.route');
const homeRoutes = require('./home.route');
const videoRoutes = require('./video.route');
const categoryRoutes = require('./category.route')

router.use('/auth', authRoutes);

// User profile routes
router.use('/profile', userRoutes);

// Creator request routes (available to all authenticated users)
router.use('/creator-requests', creatorRequestRoutes);

// Upload routes (only for creators)
router.use('/upload', uploadRoutes);

// Blog routes (public access for reading, creator access for writing)
router.use('/blogs', blogRoutes);

// Media routes (public access)
router.use('/media-metadata', auth('creator'), mediaMetaRoutes);

// Reels routes (public access)
router.use('/reels', reelsRoutes);

// Video routes (public access)
router.use('/videos', videoRoutes);

// Home routes (public access)
router.use('/home', homeRoutes);

// Category routes (public access)
router.use('/categories', categoryRoutes);

module.exports = router; 
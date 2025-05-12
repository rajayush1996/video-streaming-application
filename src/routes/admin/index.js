const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.route');


const uploadRouter = require('../admin/upload.route');
const blogRouter = require('../admin/blog.route');
const mediaMetaRouter = require('../admin/mediaMeta.route');
const categoryRouter = require('../admin/category.route');
const dashboardRouter = require('../admin/dashboard.route');
const reelsRouter = require('../admin/reels.route');
const filesRouter = require('../admin/file.route');

const userAdminRouter = require('./userAdmin.route');


router.use('/auth', authRoutes);

router.use('/users', userAdminRouter);


// Media routes
router.use('/videos', uploadRouter);
router.use('/reels', reelsRouter);
router.use('/media-metadata', mediaMetaRouter);
router.use('/files', filesRouter);

// Content routes
router.use('/blogs', blogRouter);
router.use('/categories', categoryRouter);

// Dashboard routes
router.use('/dashboard', dashboardRouter);

module.exports = router; 
const express = require('express');
// const authenticated = require('../middlewares/auth.middleware');
const authRouter = require('./auth.route');
const uploadRouter = require('./upload.route');
const blogRouter = require('./blog.route');
const userRouter = require('./user.route');
const mediaMetaRouter = require('./mediaMeta.route');
const categoryRouter = require('./category.route');
const dashboardRouter = require('./dashboard.route');
const userAdminRouter = require('./userAdmin.route');
const reelsRouter = require('./reels.route');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => {
    res.json({ message: 'OK' });
});

// router.use('/files', filesRouter);
router.use('/auth', authRouter);
router.use('/videos', uploadRouter);
router.use('/blogs', blogRouter);
router.use('/user', userRouter);
router.use('/media-metadata', mediaMetaRouter);
router.use('/categories', categoryRouter);
router.use('/dashboard', dashboardRouter);
router.use('/admin/users', userAdminRouter);
router.use('/reels', reelsRouter);

module.exports = router;

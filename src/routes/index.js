const express = require('express');
// const authenticated = require('../middlewares/auth.middleware');
const authRouter = require('./auth.route');
const uploadRouter = require('./upload.route');
const blogRouter = require('./blog.route');
const userRouter = require('./user.route');
const mediaMetaRouter = require('./mediaMeta.route');

const router = express.Router();

// router.use('/files', filesRouter);
router.use('/auth', authRouter);
router.use('/videos', uploadRouter);
router.use('/blogs', blogRouter);
router.use('/user', userRouter);
router.use('/media-metadata', mediaMetaRouter);

module.exports = router;

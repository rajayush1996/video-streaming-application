const express = require('express');
// const authenticated = require('../middlewares/auth.middleware');
const authRouter = require('./auth.route');
const uploadRouter = require('./upload.route');
const blogRouter = require('./blog.route');

const router = express.Router();

// router.use('/files', filesRouter);
router.use('/auth', authRouter);
router.use('/upload', uploadRouter)
router.use('/blogs', blogRouter)

module.exports = router;

const express = require('express');
const feedRouter = require('./feed.route');
const authenticated = require('../middlewares/auth.middleware');
const filesRouter = require('./file.route');
const pinnedRouter = require('./pinned.route')

const router = express.Router();

router.use('/feed', feedRouter);
router.use('/files', filesRouter);
router.use('/pinned-posts', pinnedRouter)

module.exports = router;

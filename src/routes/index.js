const express = require('express');
const feedRouter = require('./feed.route');
const authenticated = require('../middlewares/auth.middleware');
const filesRouter = require('./file.route');


const router = express.Router();

router.use('/feed', authenticated, feedRouter);
router.use('/files', filesRouter);


module.exports = router;

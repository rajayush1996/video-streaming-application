const express = require('express');
const authenticated = require('../middlewares/auth.middleware');
const authRouter = require('./auth.route');
const router = express.Router();

// router.use('/files', filesRouter);
router.use('/auth', authRouter);

module.exports = router;

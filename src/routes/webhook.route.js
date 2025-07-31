const express = require('express');
const router = express.Router();
const { webhookController } = require('../controllers/webhook.controller');

// BunnyCDN webhook for video status updates
router.post('/bunnycdn', webhookController.bunnyCdn);

module.exports = router;
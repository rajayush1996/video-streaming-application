const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const uploadController = require('../../controllers/upload.controller');

const router = express.Router();

// Admin routes only need authentication, no creator check needed
router.use(auth('admin')); // Admin authentication

// Upload video/reel chunk and thumbnail
router.post('/upload', uploadController.uploadVideo);

// Get upload progress
router.get('/progress', uploadController.getUploadProgress);

module.exports = router;

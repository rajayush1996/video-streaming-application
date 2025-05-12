const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const isCreator = require('../../middlewares/creator.middleware');
const uploadController = require('../../controllers/upload.controller');

const router = express.Router();

// All upload routes require authentication and creator status
router.use(auth('uploadContent'));
router.use(isCreator);

// Upload video chunk
router.post('/video/chunk', uploadController.uploadVideo);

// Upload thumbnail
router.post('/thumbnail', uploadController.uploadVideo);

// Complete video upload
router.post('/video/complete', uploadController.getUploadProgress);

module.exports = router; 
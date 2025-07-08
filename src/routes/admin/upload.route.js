const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const uploadController = require('../../controllers/upload.controller');
const newUploadController = require('../../controllers/newUpload.controller');

const router = express.Router();

// Admin routes only need authentication, no creator check needed
router.use(auth('admin')); // Admin authentication

// Upload video/reel chunk and thumbnail
router.post('/upload', uploadController.uploadVideo);

// Get upload progress
router.get('/progress', uploadController.getUploadProgress);

router.post('/initiate', newUploadController.initiateUpload);
router.get('/status/:uploadId', newUploadController.getUploadStatus);
router.post('/chunk/:uploadId/:chunkNumber', express.raw({ type: 'application/octet-stream', limit: '500mb' }), newUploadController.uploadChunk);
router.post('/complete/:uploadId', newUploadController.completeUpload);
router.post('/image', newUploadController.uploadImage);

module.exports = router;

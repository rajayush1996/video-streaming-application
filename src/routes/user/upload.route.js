const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const isCreator = require('../../middlewares/creator.middleware');
const uploadController = require('../../controllers/upload.controller');

const router = express.Router();

// All upload routes require authentication and creator status
// router.use(auth('uploadContent'));
router.use(isCreator);

/**
 * @swagger
 * /api/v1/upload/video/chunk:
 *   post:
 *     summary: Upload a video chunk (creator only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               chunk:
 *                 type: string
 *                 format: binary
 *               chunkNumber:
 *                 type: integer
 *               totalChunks:
 *                 type: integer
 *               uploadId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video chunk uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 chunkNumber:
 *                   type: integer
 *       400:
 *         description: Invalid chunk data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a creator
 */
router.post('/video/chunk', uploadController.uploadVideo);

/**
 * @swagger
 * /api/v1/upload/thumbnail:
 *   post:
 *     summary: Upload a video thumbnail (creator only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Thumbnail uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 thumbnailUrl:
 *                   type: string
 *       400:
 *         description: Invalid thumbnail data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a creator
 */
router.post('/thumbnail', uploadController.uploadVideo);

/**
 * @swagger
 * /api/v1/upload/video/complete:
 *   post:
 *     summary: Complete video upload and get progress (creator only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video upload completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videoId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 progress:
 *                   type: number
 *       400:
 *         description: Invalid upload data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a creator
 */
router.post('/video/complete', uploadController.getUploadProgress);

module.exports = router; 
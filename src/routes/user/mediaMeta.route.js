const express = require('express');
const router = express.Router();
const { mediaMetaController } = require('../../controllers/mediaMeta.controller');
const { validate } = require('../../middlewares/validation.middleware');
const mediaMetaValidation = require('../../validations/mediaMeta.validation');
const auth = require('../../middlewares/auth.middleware');
const isCreator = require('../../middlewares/creator.middleware');

/**
 * @swagger
 * /api/v1/media:
 *   get:
 *     tags: [Media]
 *     summary: Get all approved media
 *     description: Retrieve a list of all approved media with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of media retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get(
    '/',
    validate(mediaMetaValidation.getMediaMetadataSchema),
    mediaMetaController.getApprovedMedia
);

/**
 * @swagger
 * /api/v1/media/{id}:
 *   get:
 *     tags: [Media]
 *     summary: Get media by ID
 *     description: Retrieve specific media metadata by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media metadata retrieved successfully
 *       404:
 *         description: Media not found
 */
router.get(
    '/:id',
    mediaMetaController.getMediaMetadataById
);

/**
 * @swagger
 * /api/v1/media/{id}/view:
 *   put:
 *     tags: [Media]
 *     summary: Increment view count
 *     description: Increment the view count for a specific media
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: View count incremented successfully
 *       404:
 *         description: Media not found
 */
router.put(
    '/:id/view',
    validate(mediaMetaValidation.viewMediaSchema),
    mediaMetaController.incrementViewCount
);

// Creator routes (require auth and creator status)
router.use(auth('uploadContent'));
router.use(isCreator);

/**
 * @swagger
 * /api/v1/media:
 *   post:
 *     tags: [Media]
 *     summary: Create new media
 *     description: Create new media metadata (requires creator status)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Media metadata created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    validate(mediaMetaValidation.createMediaMetadataSchema),
    mediaMetaController.createMediaMetaDetails
);

/**
 * @swagger
 * /api/v1/media/{id}:
 *   patch:
 *     tags: [Media]
 *     summary: Update media
 *     description: Update existing media metadata (requires creator status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Media metadata updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Media not found
 */
router.patch(
    '/:id',
    validate(mediaMetaValidation.updateMediaMetadataSchema),
    mediaMetaController.updateMediaMetadata
);

/**
 * @swagger
 * /api/v1/media/{id}:
 *   delete:
 *     tags: [Media]
 *     summary: Delete media
 *     description: Soft delete media metadata (requires creator status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Media metadata deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Media not found
 */
router.delete(
    '/:id',
    validate(mediaMetaValidation.deleteMediaMetadataSchema),
    mediaMetaController.deleteMediaMetadata
);

module.exports = router;


const express = require('express');
const mediaMetaController = require('../controllers/mediaMeta.controller');
const authenticated = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { 
    getMediaMetadataSchema,
    updateMediaMetadataSchema,
    deleteMediaMetadataSchema,
    restoreMediaMetadataSchema
} = require('../validations/mediaMeta.validation');

const router = express.Router();

/**
 * @route GET /api/v1/media-metadata
 * @desc Get media metadata with pagination
//  * @access Private
 */
router.get('/', authenticated, validate(getMediaMetadataSchema), mediaMetaController.getMediaMetadata);

/**
 * @route PATCH /api/v1/media-metadata/:id
 * @desc Update media metadata
 */
router.patch('/:id', authenticated, validate(updateMediaMetadataSchema), mediaMetaController.updateMediaMetadata);

/**
 * @route DELETE /api/v1/media-metadata/:id
 * @desc Delete media metadata (soft delete)
 */
router.delete('/:id', authenticated, validate(deleteMediaMetadataSchema), mediaMetaController.deleteMediaMetadata);

/**
 * @route POST /api/v1/media-metadata/:id/restore
 * @desc Restore soft-deleted media metadata
 */
router.post('/:id/restore', authenticated, validate(restoreMediaMetadataSchema), mediaMetaController.restoreMediaMetadata);

/**
 * @route PUT /api/v1/media-metadata/:id/view
 * @desc Increment view count for a video
 * @access Public - No authentication required to count views
 */
router.put('/:id/view', mediaMetaController.incrementViewCount);

module.exports = router; 
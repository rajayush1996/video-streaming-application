const express = require('express');
const { mediaMetaController } = require('../../controllers/mediaMeta.controller');
const auth = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { 
    getMediaMetadataSchema,
    updateMediaMetadataSchema,
    deleteMediaMetadataSchema,
    restoreMediaMetadataSchema,
    createMediaMetadataSchema,
    getMediaMetadataByIdSchema,
    getPendingMediaSchema,
    getApprovedMediaSchema,
    getRejectedMediaSchema,
    approveMediaSchema,
    rejectMediaSchema
} = require('../../validations/mediaMeta.validation');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth('admin'));

/**
 * @route GET /api/v1/media-metadata
 * @desc Get media metadata with pagination
 */
router.get('/', validate(getMediaMetadataSchema), mediaMetaController.getMediaMetadata);

/**
 * @route put /api/v1/media-metadata/:id
 * @desc Update media metadata
 */
router.put('/:id', validate(updateMediaMetadataSchema), mediaMetaController.updateMediaMetadata);

/**
 * @route DELETE /api/v1/media-metadata/:id
 * @desc Delete media metadata (soft delete)
 */
router.delete('/:id', validate(deleteMediaMetadataSchema), mediaMetaController.deleteMediaMetadata);

/**
 * @route POST /api/v1/media-metadata/:id/restore
 * @desc Restore soft-deleted media metadata
 */
router.post('/:id/restore', validate(restoreMediaMetadataSchema), mediaMetaController.restoreMediaMetadata);

/**
 * @route PUT /api/v1/media-metadata/:id/view
 * @desc Increment view count for a video
 * @access Public - No authentication required to count views
 */
router.put('/:id/view', mediaMetaController.incrementViewCount);

router
    .route('/')
    .post(validate(createMediaMetadataSchema), mediaMetaController.createMediaMetaDetails);

router
    .route('/:id')
    .get(validate(getMediaMetadataByIdSchema), mediaMetaController.getMediaMetadataById);

router
    .route('/pending')
    .get(validate(getPendingMediaSchema), mediaMetaController.getPendingMedia);

router
    .route('/approved')
    .get(validate(getApprovedMediaSchema), mediaMetaController.getApprovedMedia);

router
    .route('/rejected')
    .get(validate(getRejectedMediaSchema), mediaMetaController.getRejectedMedia);

router
    .route('/:id/approve')
    .post(validate(approveMediaSchema), mediaMetaController.approveMedia);

router
    .route('/:id/reject')
    .post(validate(rejectMediaSchema), mediaMetaController.rejectMedia);

module.exports = router; 
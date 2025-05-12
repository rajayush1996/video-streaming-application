const express = require('express');
const router = express.Router();
const { mediaMetaController } = require('../../controllers/mediaMeta.controller');
const { validate } = require('../../middlewares/validation.middleware');
const mediaMetaValidation = require('../../validations/mediaMeta.validation');
const auth = require('../../middlewares/auth.middleware');
const isCreator = require('../../middlewares/creator.middleware');

// Public routes (no auth required)
router.get(
    '/',
    validate(mediaMetaValidation.getMediaMetadataSchema),
    mediaMetaController.getApprovedMedia
);

router.get(
    '/:id',
    mediaMetaController.getMediaMetadataById
);

router.put(
    '/:id/view',
    validate(mediaMetaValidation.viewMediaSchema),
    mediaMetaController.incrementViewCount
);

// Creator routes (require auth and creator status)
router.use(auth('uploadContent'));
router.use(isCreator);

// Create new video
router.post(
    '/',
    validate(mediaMetaValidation.createMediaMetadataSchema),
    mediaMetaController.createMediaMetaDetails
);

// Update video
router.patch(
    '/:id',
    validate(mediaMetaValidation.updateMediaMetadataSchema),
    mediaMetaController.updateMediaMetadata
);

// Delete video (soft delete)
router.delete(
    '/:id',
    validate(mediaMetaValidation.deleteMediaMetadataSchema),
    mediaMetaController.deleteMediaMetadata
);

module.exports = router;


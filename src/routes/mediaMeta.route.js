const express = require('express');
const mediaMetaController = require('../controllers/mediaMeta.controller');
const authenticated = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { getMediaMetadataSchema } = require('../validations/mediaMeta.validation');

const router = express.Router();

/**
 * @route GET /api/v1/media-metadata
 * @desc Get media metadata with pagination
//  * @access Private
 */
router.get('/', authenticated, validate(getMediaMetadataSchema), mediaMetaController.getMediaMetadata);

module.exports = router; 
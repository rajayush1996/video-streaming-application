const express = require('express');
const reelsController = require('../../controllers/reels.controller');
const reelsUploadController = require('../../controllers/upload.controller');
const { validate } = require('../../middlewares/validation.middleware');
const auth = require('../../middlewares/auth.middleware');
const reelsValidation = require('../../validations/reels.validation');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth('admin'));

/**
 * @route GET /api/v1/reels
 * @desc Get all reels with filtering and pagination
 * @access Public
 */
router.get(
    '/', 
    validate(reelsValidation.getReelsSchema), 
    reelsController.getAllReels
);

/**
 * @route GET /api/v1/reels/:id
 * @desc Get a single reel by ID
 * @access Public
 */
router.get(
    '/:id', 
    validate(reelsValidation.getReelSchema), 
    reelsController.getReelById
);

/**
 * @route PATCH /api/v1/reels/:id
 * @desc Update a reel
 * @access Private
 */
router.patch(
    '/:id', 
    validate(reelsValidation.updateReelSchema), 
    reelsController.updateReel
);

/**
 * @route DELETE /api/v1/reels/:id
 * @desc Soft delete a reel
 * @access Private
 */
router.delete(
    '/:id', 
    validate(reelsValidation.deleteReelSchema), 
    reelsController.softDeleteReel
);

/**
 * @route PUT /api/v1/reels/:id/view
 * @desc Increment view count for a reel
 * @access Public
 */
router.put(
    '/:id/view', 
    validate(reelsValidation.viewReelSchema), 
    reelsController.incrementViewCount
);

/**
 * @route POST /api/v1/reels/upload
 * @desc Upload a new reel with chunked upload
 * @access Private
 */
router.post(
    '/upload',
    reelsUploadController.uploadReel
);

module.exports = router;
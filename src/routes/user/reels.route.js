const express = require('express');
const router = express.Router();
const reelsController = require('../../controllers/reels.controller');
const { validate } = require('../../middlewares/validation.middleware');
const reelsValidation = require('../../validations/reels.validation');
const auth = require('../../middlewares/auth.middleware');
const isCreator = require('../../middlewares/creator.middleware');

// Public routes (no auth required)
router.get(
    '/',
    validate(reelsValidation.getReelsSchema),
    reelsController.getAllReels
);

router.get(
    '/:id',
    validate(reelsValidation.getReelSchema),
    reelsController.getReelById
);

router.put(
    '/:id/view',
    validate(reelsValidation.viewReelSchema),
    reelsController.incrementViewCount
);

// Creator routes (require auth and creator status)
router.use(auth('uploadContent'));
router.use(isCreator);

// Update reel
router.patch(
    '/:id',
    validate(reelsValidation.updateReelSchema),
    reelsController.updateReel
);

// Delete reel (soft delete)
router.delete(
    '/:id',
    validate(reelsValidation.deleteReelSchema),
    reelsController.softDeleteReel
);

module.exports = router; 
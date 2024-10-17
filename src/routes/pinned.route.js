const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validation.middleware');
const { createFeedValidationSchema } = require('../validations/feed.validation');
const PinnedPostController = require('../controllers/pinned.controller');

router.get('/pin/:postId', PinnedPostController.getPinnedPostsByPostId);
router.get('/user/:authorId', PinnedPostController.getPinnedPostsByUser);
router.post('/unpin/:postId', PinnedPostController.unpinPost);
router.post('/pin/:postId', PinnedPostController.pinPost);
 
module.exports = router;

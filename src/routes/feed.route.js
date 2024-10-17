/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const { FeedController } = require('../controllers');
const { validate } = require('../middlewares/validation.middleware');
const { createFeedValidationSchema } = require('../validations/feed.validation');
const multer = require('../middlewares/upload.middleware');
/* GET users listing. */

router.get('/', FeedController.getAllFeeds);
router.post('/',multer.array('files'), validate(createFeedValidationSchema), FeedController.createFeed)
router.get('/:id', FeedController.getFeedById),

router.put('/:id', FeedController.updateFeed),

module.exports = router;
 
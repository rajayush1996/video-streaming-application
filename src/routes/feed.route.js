/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const { FeedController } = require('../controllers');
const { validate } = require('../middlewares/validation.middleware');
const { createFeedValidationSchema } = require('../validations/feed.validation');
const multer = require('../middlewares/upload.middleware');
/* GET users listing. */

router.get('/', (req, res, next) => {
    console.log("🚀 ~ file: feed.route.js:10 ~ router.get ~ req:", req);
    try {  
     res.send('respond with a resource');

    } catch (err) {

    }
});
router.post('/',multer.array('files'), validate(createFeedValidationSchema), FeedController.createFeed)


module.exports = router;

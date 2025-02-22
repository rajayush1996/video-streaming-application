const express = require('express');
const router = express.Router();
const { validate } = require('../middlewares/validation.middleware');
const AuthController = require('../controllers/auth.controller');

// router.get('/pin/:postId', PinnedPostController.getPinnedPostsByPostId);
// router.get('/user/:authorId', PinnedPostController.getPinnedPostsByUser);
// router.post('/unpin/:postId', PinnedPostController.unpinPost);
// router.post('/pin/:postId', PinnedPostController.pinPost);
router.post('/sign-up', AuthController.signUp);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerificationEmail);
 
module.exports = router;

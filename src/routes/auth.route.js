const express = require('express');
const router = express.Router();
// const { validate } = require('../middlewares/validation.middleware');
const AuthController = require('../controllers/auth.controller');

// router.get('/pin/:postId', PinnedPostController.getPinnedPostsByPostId);
// router.get('/user/:authorId', PinnedPostController.getPinnedPostsByUser);
// router.post('/unpin/:postId', PinnedPostController.unpinPost);
// router.post('/pin/:postId', PinnedPostController.pinPost);
router.post('/sign-up', AuthController.signUp);
router.post('/sign-in', AuthController.signIn);
router.post('/verify-email', AuthController.verifyEmail);
router.get('/refresh-token', AuthController.verifyRefreshToken);
router.post('/resend-verification', AuthController.resendVerificationEmail);

 
module.exports = router;

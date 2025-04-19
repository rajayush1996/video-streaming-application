const express = require('express');
const router = express.Router();
// const { validate } = require('../middlewares/validation.middleware');
const AuthController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validation.middleware');
const { signInSchema } = require('../validations/auth.validation');

// router.get('/pin/:postId', PinnedPostController.getPinnedPostsByPostId);
// router.get('/user/:authorId', PinnedPostController.getPinnedPostsByUser);
// router.post('/unpin/:postId', PinnedPostController.unpinPost);
// router.post('/pin/:postId', PinnedPostController.pinPost);
router.post('/sign-up', AuthController.signUp);
router.post('/sign-in', validate(signInSchema), AuthController.signIn);
router.post('/verify-email', AuthController.verifyEmail);
router.get('/refresh-token', AuthController.verifyRefreshToken);
router.post('/resend-verification', AuthController.resendVerificationEmail);

/**
 * @swagger
 * /api/v1/auth/signin:
 *   post:
 *     summary: Sign in with username and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */

module.exports = router;

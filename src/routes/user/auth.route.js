const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const { validate } = require('../../middlewares/validation.middleware');
const { signUpSchema, userSignInSchema, forgotPasswordSchema, verifyResetTokenSchema, resetPasswordSchema } = require('../../validations/auth.validation');

/**
 * @swagger
 * /api/v1/user/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignUp'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Email or username already exists
 */
router.post('/signup', validate(signUpSchema), authController.signUp);

/**
 * @swagger
 * /api/v1/user/auth/signin:
 *   post:
 *     summary: Sign in user
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignIn'
 *     responses:
 *       200:
 *         description: User signed in successfully
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified or account locked
 */
router.post('/signin', validate(userSignInSchema), authController.userSignIn);

/**
 * @swagger
 * /api/v1/user/auth/verify-email:
 *   get:
 *     summary: Verify user email
 *     tags: [User Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @swagger
 * /api/v1/user/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Email already verified
 *       404:
 *         description: User not found
 */
router.post('/resend-verification', validate(signUpSchema), authController.resendVerificationEmail);

/**
 * @swagger
 * /api/v1/user/auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token from cookies
 *     tags: [User Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid or missing refresh token
 */
router.post('/refresh-token', authController.verifyRefreshToken);

/**
 * @swagger
 * /api/v1/user/auth/send-otp:
 *   post:
 *     summary: Send OTP to user's email
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 */
router.post('/send-otp', authController.sendOtpToEmail);

/**
 * @swagger
 * /api/v1/user/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */
router.post('/verify-otp', authController.verifyOtpUser);

/**
 * @swagger
 * /api/v1/user/auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [User Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent successfully
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.requestPasswordReset);

/**
 * @swagger
 * /api/v1/user/auth/verify-reset-token:
 *   get:
 *     summary: Verify password reset token
 *     tags: [User Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid or expired token
 */
router.get('/verify-reset-token', validate(verifyResetTokenSchema), authController.verifyResetToken);

/**
 * @swagger
 * /api/v1/user/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [User Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Passwords do not match
 *       401:
 *         description: Invalid or expired token
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router; 
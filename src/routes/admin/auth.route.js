const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/auth.controller');
const { validate } = require('../../middlewares/validation.middleware');
const { adminSignInSchema } = require('../../validations/auth.validation');

/**
 * @swagger
 * /api/v1/admin/auth/signin:
 *   post:
 *     summary: Sign in admin (username or email)
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminSignIn'
 *     responses:
 *       200:
 *         description: Admin signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account locked
 */
router.post('/sign-in', validate(adminSignInSchema), AuthController.adminSignIn);

/**
 * @swagger
 * /api/v1/admin/auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token from cookies
 *     tags: [Admin Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid or missing refresh token
 */
router.post('/refresh-token', AuthController.verifyRefreshToken);

module.exports = router; 
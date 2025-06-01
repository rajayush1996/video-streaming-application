const express = require('express');
const InteractionController = require('../../controllers/interaction.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const interactionValidation = require('../../validations/interaction.validation');

const router = express.Router();
const interactionController = new InteractionController();

/**
 * @swagger
 * /api/v1/interactions:
 *   post:
 *     summary: Record a new interaction
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - targetType
 *               - targetId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [follow, unfollow, like, unlike, comment, reply, share, bookmark, mention, tag]
 *               targetType:
 *                 type: string
 *                 enum: [user, media, blog, comment]
 *               targetId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Interaction recorded successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    authenticate,
    validate(interactionValidation.recordInteraction),
    interactionController.recordInteraction.bind(interactionController)
);

/**
 * @swagger
 * /api/v1/interactions/unread/count:
 *   get:
 *     summary: Get unread interactions count
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/unread/count', authenticate, interactionController.getUnreadCount.bind(interactionController));

/**
 * @swagger
 * /api/v1/interactions/recent:
 *   get:
 *     summary: Get recent interactions
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent interactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recent', authenticate, interactionController.getRecentInteractions.bind(interactionController));

/**
 * @swagger
 * /api/v1/interactions/target/{targetType}/{targetId}:
 *   get:
 *     summary: Get interactions for a specific target
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, media, blog, comment]
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Target interactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/target/:targetType/:targetId',
    authenticate,
    validate(interactionValidation.getInteractionsByTarget),
    interactionController.getInteractionsByTarget.bind(interactionController)
);

/**
 * @swagger
 * /api/v1/interactions/mark-read:
 *   post:
 *     summary: Mark interactions as read
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interactionIds
 *             properties:
 *               interactionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       204:
 *         description: Interactions marked as read successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/mark-read',
    authenticate,
    validate(interactionValidation.markAsRead),
    interactionController.markAsRead.bind(interactionController)
);

/**
 * @swagger
 * /api/v1/interactions/archive:
 *   post:
 *     summary: Archive interactions
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interactionIds
 *             properties:
 *               interactionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       204:
 *         description: Interactions archived successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/archive',
    authenticate,
    validate(interactionValidation.archiveInteractions),
    interactionController.archiveInteractions.bind(interactionController)
);

/**
 * @swagger
 * /api/v1/interactions/feed:
 *   get:
 *     summary: Get user's activity feed
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Activity feed retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/feed', authenticate, interactionController.getActivityFeed.bind(interactionController));

module.exports = router; 
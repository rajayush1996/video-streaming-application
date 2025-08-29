const express = require('express');
const router = express.Router();
const reelsController = require('../../controllers/reels.controller');
const { validate } = require('../../middlewares/validation.middleware');
const reelsValidation = require('../../validations/reels.validation');
const isCreator = require('../../middlewares/creator.middleware');

/**
 * @swagger
 * /api/v1/reels:
 *   get:
 *     summary: Get all reels
 *     tags: [Reels]
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
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                       views:
 *                         type: integer
 *                       creator:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get(
    '/',
    validate(reelsValidation.getReelsSchema),
    reelsController.getAllReels
);

/**
 * @swagger
 * /api/v1/reels/{id}:
 *   get:
 *     summary: Get reel by ID
 *     tags: [Reels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reel details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 videoUrl:
 *                   type: string
 *                 thumbnail:
 *                   type: string
 *                 views:
 *                   type: integer
 *                 creator:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *       404:
 *         description: Reel not found
 */
router.get(
    '/:id',
    validate(reelsValidation.getReelSchema),
    reelsController.getReelById
);

/**
 * @swagger
 * /api/v1/reels/{id}/view:
 *   put:
 *     summary: Increment reel view count
 *     tags: [Reels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: View count update queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 views:
 *                   type: integer
 *       404:
 *         description: Reel not found
 */
router.put(
    '/:id/view',
    validate(reelsValidation.viewReelSchema),
    reelsController.incrementViewCount
);

// Creator routes (require auth and creator status)
// router.use(auth('uploadContent'));
router.use(isCreator);

/**
 * @swagger
 * /api/v1/reels/{id}:
 *   patch:
 *     summary: Update reel (creator only)
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reel updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a creator
 *       404:
 *         description: Reel not found
 */
router.patch(
    '/:id',
    validate(reelsValidation.updateReelSchema),
    reelsController.updateReel
);

/**
 * @swagger
 * /api/v1/reels/{id}:
 *   delete:
 *     summary: Delete reel (creator only)
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reel deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a creator
 *       404:
 *         description: Reel not found
 */
router.delete(
    '/:id',
    validate(reelsValidation.deleteReelSchema),
    reelsController.softDeleteReel
);

module.exports = router; 
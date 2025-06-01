const express = require('express');
const router = express.Router();
const videoController = require('../../controllers/video.controller');
const { validate } = require('../../middlewares/validation.middleware');
const { getVideosSchema, getVideoByIdSchema } = require('../../validations/video.validation');

/**
 * @swagger
 * /api/v1/user/videos:
 *   get:
 *     summary: Get all videos with pagination and filters
 *     tags: [Videos]
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, viewCount, likeCount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videos:
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
 *                       status:
 *                         type: string
 *                       isFeatured:
 *                         type: boolean
 *                       isTrending:
 *                         type: boolean
 *                       viewCount:
 *                         type: number
 *                       likeCount:
 *                         type: number
 *                       commentCount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                           bio:
 *                             type: string
 *                       category:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                       thumbnail:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           url:
 *                             type: string
 *                           type:
 *                             type: string
 *                           metadata:
 *                             type: object
 *                       content:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           url:
 *                             type: string
 *                           type:
 *                             type: string
 *                           metadata:
 *                             type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 */
router.get(
    '/',
    validate(getVideosSchema),
    videoController.getAllVideos
);

/**
 * @swagger
 * /api/v1/user/videos/{videoId}:
 *   get:
 *     summary: Get video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video retrieved successfully
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
 *                 status:
 *                   type: string
 *                 isFeatured:
 *                   type: boolean
 *                 isTrending:
 *                   type: boolean
 *                 viewCount:
 *                   type: number
 *                 likeCount:
 *                   type: number
 *                 commentCount:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                     bio:
 *                       type: string
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                 thumbnail:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                     metadata:
 *                       type: object
 *                 content:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                     metadata:
 *                       type: object
 */
router.get(
    '/:videoId',
    validate(getVideoByIdSchema),
    videoController.getVideoById
);

module.exports = router; 
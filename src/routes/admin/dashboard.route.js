const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboard.controller');
const auth = require('../../middlewares/auth.middleware');

// Apply admin authentication to all routes
router.use(auth('admin'));

/**
 * @swagger
 * /api/v1/dashboard/metrics:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get overview metrics
 *     description: Retrieve key metrics and statistics for the dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalCreators:
 *                   type: integer
 *                 totalContent:
 *                   type: integer
 *                 totalViews:
 *                   type: integer
 *                 activeUsers:
 *                   type: integer
 *                 newUsers:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/metrics', dashboardController.getOverviewMetrics);

/**
 * @swagger
 * /api/v1/dashboard/activities:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent activities
 *     description: Retrieve recent system activities and user actions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of activities to retrieve
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/activities', dashboardController.getRecentActivities);

/**
 * @swagger
 * /api/v1/dashboard/status:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get system status
 *     description: Retrieve current system status and health metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, critical]
 *                 uptime:
 *                   type: number
 *                 cpuUsage:
 *                   type: number
 *                 memoryUsage:
 *                   type: number
 *                 activeConnections:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/status', dashboardController.getSystemStatus);

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get all dashboard data
 *     description: Retrieve all dashboard data in a single call
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     totalCreators:
 *                       type: integer
 *                     totalContent:
 *                       type: integer
 *                     totalViews:
 *                       type: integer
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                 status:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     uptime:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', dashboardController.getDashboardData);

/**
 * @swagger
 * /api/v1/dashboard/moderation:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get moderation statistics
 *     description: Retrieve counts of pending, approved and rejected media
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Moderation stats retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/moderation', dashboardController.getModeration);
router.patch('/moderation/:id/status', dashboardController.updateModeration);




module.exports = router; 
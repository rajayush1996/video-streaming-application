const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLog.controller');
const auth = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get all audit logs
 *     description: Retrieve all audit logs with filtering and pagination (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', auth('admin'), auditLogController.getAuditLogs);

/**
 * @swagger
 * /api/v1/audit-logs/user/{userId}:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get user audit logs
 *     description: Retrieve audit logs for a specific user (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', auth('admin'), auditLogController.getUserAuditLogs);

/**
 * @swagger
 * /api/v1/audit-logs/resource/{resourceType}/{resourceId}:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get resource audit logs
 *     description: Retrieve audit logs for a specific resource (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of resource (e.g., user, blog, media)
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Resource audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Resource not found
 */
router.get('/resource/:resourceType/:resourceId', auth('admin'), auditLogController.getResourceAuditLogs);

/**
 * @swagger
 * /api/v1/audit-logs/action/{action}:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get action audit logs
 *     description: Retrieve audit logs by action type (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *         description: Action type (e.g., create, update, delete)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Action audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/action/:action', auth('admin'), auditLogController.getActionAuditLogs);

module.exports = router; 
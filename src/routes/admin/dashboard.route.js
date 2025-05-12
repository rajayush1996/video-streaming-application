const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboard.controller');
const auth = require('../../middlewares/auth.middleware');

// Apply admin authentication to all routes
router.use(auth('admin'));

/**
 * @route GET /api/v1/dashboard/metrics
 * @desc Get overview metrics
 * @access Private
 */
router.get('/metrics', dashboardController.getOverviewMetrics);

/**
 * @route GET /api/v1/dashboard/activities
 * @desc Get recent activities
 * @access Private
 */
router.get('/activities', dashboardController.getRecentActivities);

/**
 * @route GET /api/v1/dashboard/status
 * @desc Get system status
 * @access Private
 */
router.get('/status', dashboardController.getSystemStatus);

/**
 * @route GET /api/v1/dashboard
 * @desc Get all dashboard data in one call
 * @access Private
 */
router.get('/', dashboardController.getDashboardData);

module.exports = router; 
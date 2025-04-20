const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticated = require('../middlewares/auth.middleware');

/**
 * @route GET /api/v1/dashboard/metrics
 * @desc Get overview metrics
 * @access Private
 */
router.get('/metrics', authenticated, dashboardController.getOverviewMetrics);

/**
 * @route GET /api/v1/dashboard/activities
 * @desc Get recent activities
 * @access Private
 */
router.get('/activities', authenticated, dashboardController.getRecentActivities);

/**
 * @route GET /api/v1/dashboard/status
 * @desc Get system status
 * @access Private
 */
router.get('/status', authenticated, dashboardController.getSystemStatus);

/**
 * @route GET /api/v1/dashboard
 * @desc Get all dashboard data in one call
 * @access Private
 */
router.get('/', authenticated, dashboardController.getDashboardData);

module.exports = router; 
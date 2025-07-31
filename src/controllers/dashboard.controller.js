const dashboardService = require('../services/dashboard.service');
const httpStatus = require('http-status');
const logger = require('../features/logger');

/**
 * Get overview metrics
 * @route GET /api/v1/dashboard/metrics
 * @returns {Object} Dashboard metrics including total videos, blogs, views, users
 */
exports.getOverviewMetrics = async (req, res, next) => {
    try {
        const metrics = await dashboardService.getOverviewMetrics();
        return res.status(httpStatus.OK).json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Error in getOverviewMetrics controller:', error);
        next(error);
    }
};

/**
 * Get recent activities
 * @route GET /api/v1/dashboard/activities
 * @returns {Array} Recent activities in the system
 */
exports.getRecentActivities = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const activities = await dashboardService.getRecentActivities(limit);
        return res.status(httpStatus.OK).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        logger.error('Error in getRecentActivities controller:', error);
        next(error);
    }
};

/**
 * Get system status
 * @route GET /api/v1/dashboard/status
 * @returns {Object} System status including storage and moderation information
 */
exports.getSystemStatus = async (req, res, next) => {
    try {
        const systemStatus = await dashboardService.getSystemStatus();
        return res.status(httpStatus.OK).json({
            success: true,
            data: systemStatus
        });
    } catch (error) {
        logger.error('Error in getSystemStatus controller:', error);
        next(error);
    }
};


/**
 * Get moderation statistics
 * @route GET /api/v1/dashboard/moderation
 * @returns {Object} Moderation stats grouped by media type
 */
exports.getModerationStats = async (req, res, next) => {
    try {
        const stats = await dashboardService.getModerationStats();
        return res.status(httpStatus.OK).json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error in getModerationStats controller:', error);
        next(error);
    }
};

exports.getModeration = async (req, res, next) => {
    try {
        const status = req.query?.status;
        const stats = await dashboardService.getModeration(status);
        return res.status(httpStatus.OK).json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error in getModerationStats controller:', error);
        next(error);
    }
};

exports.updateModeration = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status: approvedStatus, rejectedReason } = req.body;
        const result = await dashboardService.updateModerationStatus(id, {
            approvedStatus,
            rejectedReason,
        });
        return res.status(httpStatus.OK).json({ success: true, data: result });
    } catch (error) {
        logger.error('Error in updateModeration controller:', error);
        next(error);
    }
};

/**
 * Get all dashboard data in one call
 * @route GET /api/v1/dashboard
 * @returns {Object} All dashboard data including metrics, activities, and system status
 */
exports.getDashboardData = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        
        // Execute all service calls in parallel
        const [metrics, activities, systemStatus] = await Promise.all([
            dashboardService.getOverviewMetrics(),
            dashboardService.getRecentActivities(limit),
            dashboardService.getSystemStatus()
        ]);
        
        return res.status(httpStatus.OK).json({
            success: true,
            data: {
                metrics,
                activities: {
                    count: activities.length,
                    items: activities
                },
                systemStatus
            }
        });
    } catch (error) {
        logger.error('Error in getDashboardData controller:', error);
        next(error);
    }
}; 
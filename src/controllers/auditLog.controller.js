const auditLogService = require('../services/auditLog.service');
const httpStatus = require('http-status');
const logger = require('../features/logger');
const { responseHandler } = require('../features/error');

/**
 * Get all audit logs with filtering and pagination
 * @route GET /api/v1/audit-logs
 */
exports.getAuditLogs = async (req, res, next) => {
    try {
        const { page, limit, sortBy, sortOrder, action, resourceType, userId, status } = req.query;
        
        // Build filter
        const filter = {};
        if (action) filter.action = action;
        if (resourceType) filter.resourceType = resourceType;
        if (userId) filter.userId = userId;
        if (status) filter.status = status;

        // Build options
        const options = { page, limit, sortBy, sortOrder };

        const result = await auditLogService.getAuditLogs(filter, options);
        responseHandler(res, httpStatus.OK, 'Audit logs retrieved successfully', result);
    } catch (error) {
        logger.error('Error in getAuditLogs controller:', error);
        next(error);
    }
};

/**
 * Get audit logs for a specific user
 * @route GET /api/v1/audit-logs/user/:userId
 */
exports.getUserAuditLogs = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page, limit, sortBy, sortOrder } = req.query;
        
        const options = { page, limit, sortBy, sortOrder };
        const result = await auditLogService.getUserAuditLogs(userId, options);
        
        responseHandler(res, httpStatus.OK, 'User audit logs retrieved successfully', result);
    } catch (error) {
        logger.error(`Error in getUserAuditLogs controller for user ${req.params.userId}:`, error);
        next(error);
    }
};

/**
 * Get audit logs for a specific resource
 * @route GET /api/v1/audit-logs/resource/:resourceType/:resourceId
 */
exports.getResourceAuditLogs = async (req, res, next) => {
    try {
        const { resourceType, resourceId } = req.params;
        const { page, limit, sortBy, sortOrder } = req.query;
        
        const options = { page, limit, sortBy, sortOrder };
        const result = await auditLogService.getResourceAuditLogs(resourceType, resourceId, options);
        
        responseHandler(res, httpStatus.OK, 'Resource audit logs retrieved successfully', result);
    } catch (error) {
        logger.error(`Error in getResourceAuditLogs controller for ${req.params.resourceType}/${req.params.resourceId}:`, error);
        next(error);
    }
};

/**
 * Get audit logs by action type
 * @route GET /api/v1/audit-logs/action/:action
 */
exports.getActionAuditLogs = async (req, res, next) => {
    try {
        const { action } = req.params;
        const { page, limit, sortBy, sortOrder } = req.query;
        
        const options = { page, limit, sortBy, sortOrder };
        const result = await auditLogService.getActionAuditLogs(action, options);
        
        responseHandler(res, httpStatus.OK, 'Action audit logs retrieved successfully', result);
    } catch (error) {
        logger.error(`Error in getActionAuditLogs controller for action ${req.params.action}:`, error);
        next(error);
    }
}; 
const AuditLog = require('../models/auditLog.model');
const logger = require('../features/logger');
const httpStatus = require('http-status');
const { ApiError } = require('../features/error');

class AuditLogService {
    /**
     * Create a new audit log entry
     * @param {Object} logData - The audit log data
     * @returns {Promise<Object>} Created audit log
     */
    async createAuditLog(logData) {
        try {
            // Defensive: ensure _id is set
            if (!logData._id || !logData._id.startsWith('al-')) {
                const utils = require('../utils');
                logData._id = utils.uuid('al-');
            }
            const auditLog = await AuditLog.create(logData);
            return auditLog;
        } catch (error) {
            logger.error('Error creating audit log:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating audit log');
        }
    }

    /**
     * Get audit logs with filtering and pagination
     * @param {Object} filter - Filter criteria
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Audit logs with pagination info
     */
    async getAuditLogs(filter = {}, options = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
            
            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query with pagination
            const [logs, total] = await Promise.all([
                AuditLog.find(filter)
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .populate('userId', 'username email')
                    .lean(),
                AuditLog.countDocuments(filter)
            ]);

            return {
                results: logs,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(total / limit),
                totalResults: total
            };
        } catch (error) {
            logger.error('Error getting audit logs:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching audit logs');
        }
    }

    /**
     * Get audit logs for a specific user
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} User's audit logs
     */
    async getUserAuditLogs(userId, options = {}) {
        return this.getAuditLogs({ userId }, options);
    }

    /**
     * Get audit logs for a specific resource
     * @param {string} resourceType - Type of resource
     * @param {string} resourceId - Resource ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Resource's audit logs
     */
    async getResourceAuditLogs(resourceType, resourceId, options = {}) {
        return this.getAuditLogs({ resourceType, resourceId }, options);
    }

    /**
     * Get audit logs by action type
     * @param {string} action - Action type
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Action's audit logs
     */
    async getActionAuditLogs(action, options = {}) {
        return this.getAuditLogs({ action }, options);
    }
}

module.exports = new AuditLogService(); 
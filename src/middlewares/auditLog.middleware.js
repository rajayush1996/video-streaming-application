/* eslint-disable no-unused-vars */
const auditLogService = require('../services/auditLog.service');
const logger = require('../features/logger');

/**
 * Middleware to log user activities
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
const auditLogMiddleware = (options = {}) => {
    return async (req, res, next) => {
        // Store original end function
        const originalEnd = res.end;

        // Store original data for comparison
        let originalData = null;

        // For GET requests, store the response data
        if (req.method === 'GET' && req.params.id) {
            const originalJson = res.json;
            res.json = function(data) {
                originalData = data;
                return originalJson.call(this, data);
            };
        }

        // For PUT/PATCH requests, store the original data
        if ((req.method === 'PUT' || req.method === 'PATCH') && req.params.id) {
            try {
                // Get the model based on the route
                const model = getModelFromPath(req.path);
                if (model) {
                    originalData = await model.findById(req.params.id).lean();
                }
            } catch (error) {
                logger.error('Error fetching original data:', error);
            }
        }

        // Override end function
        res.end = function (chunk, encoding) {
            // Restore original end
            res.end = originalEnd;

            // Get request details
            const userId = req.user?.id;
            const method = req.method;
            const path = req.path;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('user-agent');

            // Map HTTP methods to actions
            const methodToAction = {
                'POST': 'CREATE',
                'PUT': 'UPDATE',
                'PATCH': 'UPDATE',
                'DELETE': 'DELETE',
                'GET': 'READ'
            };

            // Map path to resource type
            const pathToResourceType = {
                '/api/v1/users': 'USER',
                '/api/v1/videos': 'VIDEO',
                '/api/v1/blogs': 'BLOG',
                '/api/v1/comments': 'COMMENT',
                '/api/v1/media': 'MEDIA',
                '/api/v1/profile': 'PROFILE',
                '/api/v1/settings': 'SETTINGS'
            };

            // Determine resource type from path
            let resourceType = 'SYSTEM';
            for (const [pathPrefix, type] of Object.entries(pathToResourceType)) {
                if (path.startsWith(pathPrefix)) {
                    resourceType = type;
                    break;
                }
            }

            // Get resource ID from path parameters
            const resourceId = req.params.id || 'system';

            // Prepare changes object
            let changes = {};
            if (method === 'PUT' || method === 'PATCH') {
                changes = {
                    before: originalData,
                    after: req.body
                };
            } else if (method === 'DELETE') {
                changes = {
                    before: originalData,
                    after: null
                };
            } else if (method === 'POST') {
                changes = {
                    before: null,
                    after: req.body
                };
            }

            // Create audit log entry
            const logData = {
                userId,
                action: methodToAction[method] || 'OTHER',
                resourceType,
                resourceId,
                details: {
                    method,
                    path,
                    statusCode: res.statusCode,
                    requestBody: req.body,
                    queryParams: req.query,
                    changes
                },
                ipAddress,
                userAgent,
                status: res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILURE'
            };

            // Log the activity asynchronously
            auditLogService.createAuditLog(logData)
                .catch(error => {
                    logger.error('Error creating audit log:', error);
                });

            // Call original end
            return originalEnd.call(this, chunk, encoding);
        };

        next();
    };
};

/**
 * Helper function to get model based on path
 * @param {string} path - Request path
 * @returns {Object|null} Mongoose model or null
 */
function getModelFromPath(path) {
    const pathToModel = {
        '/api/v1/users': 'UserCredentials',
        '/api/v1/videos': 'MediaMeta',
        '/api/v1/blogs': 'Blog',
        '/api/v1/comments': 'Comment',
        '/api/v1/media': 'MediaMeta',
        '/api/v1/profile': 'UserProfile',
        '/api/v1/settings': 'NotificationSetting'
    };

    for (const [pathPrefix, modelName] of Object.entries(pathToModel)) {
        if (path.startsWith(pathPrefix)) {
            try {
                return require(`../models/${modelName.toLowerCase()}.model`);
            } catch (error) {
                logger.error(`Error loading model ${modelName}:`, error);
                return null;
            }
        }
    }
    return null;
}

module.exports = auditLogMiddleware; 
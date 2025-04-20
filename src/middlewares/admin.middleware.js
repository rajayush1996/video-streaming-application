const httpStatus = require('http-status');
const logger = require('../features/logger');

/**
 * Middleware to ensure only admin users can access certain routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const adminOnly = (req, res, next) => {
    try {
        if (!req.user) {
            logger.warn('Unauthorized access attempt: No user in request');
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'You must be logged in'
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'ADMIN') {
            logger.warn(`Forbidden access attempt: User ${req.user.id} with role ${req.user.role} tried to access admin-only resource`);
            return res.status(httpStatus.FORBIDDEN).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // User is admin, proceed
        next();
    } catch (error) {
        logger.error('Error in admin middleware:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = adminOnly; 
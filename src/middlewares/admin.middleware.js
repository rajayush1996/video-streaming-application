const { ForbiddenError } = require('../features/error');

/**
 * Middleware to ensure only admin users can access certain routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
    }

    if (req.user.role !== 'admin') {
        return next(new ForbiddenError('Admin access required'));
    }

    next();
};

module.exports = adminOnly; 
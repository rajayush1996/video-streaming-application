const mongoose = require('mongoose');

/**
 * Middleware to set audit context for database operations
 * @returns {Function} Express middleware
 */
const auditContextMiddleware = () => {
    return (req, res, next) => {
        // Store original mongoose methods
        const originalFind = mongoose.Model.find;
        const originalFindOne = mongoose.Model.findOne;
        const originalFindById = mongoose.Model.findById;

        // Override find method
        mongoose.Model.find = function() {
            const query = originalFind.apply(this, arguments);
            return query.setOptions({
                currentUser: req.user,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            });
        };

        // Override findOne method
        mongoose.Model.findOne = function() {
            const query = originalFindOne.apply(this, arguments);
            return query.setOptions({
                currentUser: req.user,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            });
        };

        // Override findById method
        mongoose.Model.findById = function() {
            const query = originalFindById.apply(this, arguments);
            return query.setOptions({
                currentUser: req.user,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            });
        };

        // Restore original methods after response
        res.on('finish', () => {
            mongoose.Model.find = originalFind;
            mongoose.Model.findOne = originalFindOne;
            mongoose.Model.findById = originalFindById;
        });

        next();
    };
};

module.exports = auditContextMiddleware; 
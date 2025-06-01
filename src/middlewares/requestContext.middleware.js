const asyncLocalStorage = require('../context');

function requestContextMiddleware(req, res, next) {
    const context = {
        userId: req.user?.id || 'anonymous',
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
    };
    asyncLocalStorage.run(context, () => next());
}

module.exports = requestContextMiddleware; 
const jwt = require('jsonwebtoken');
const config = require('../../config');
const UserCredentials = require('../models/userCredentials.model');
const { UnauthorizedError } = require('../features/error');
const logger = require('../features/logger');

const auth = (permission) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            console.log("🚀 ~ return ~ authHeader:", authHeader);
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedError('No token provided');
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, config.authentication.jwt_token_secret_key);
            
            const user = await UserCredentials.findById(decoded.id);
            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            if (user.status !== 'active') {
                throw new UnauthorizedError('User account is not active');
            }

            // Check if account is locked
            if (user.lockUntil && user.lockUntil > Date.now()) {
                throw new UnauthorizedError('Account is locked. Please try again later');
            }

            // Attach user to request object
            req.user = {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            };

            // If permission is provided, check if user has the required role
            if (permission) {
                if (typeof permission === 'string') {
                    // Handle string permission (e.g., 'uploadContent')
                    if (permission === 'uploadContent' && user.role !== 'creator') {
                        throw new UnauthorizedError('Only creators can upload content');
                    }
                    // Add more permission checks as needed
                } else if (typeof permission === 'function') {
                    // Handle function permission
                    await permission(req, res, next);
                    return;
                }
            }
            
            next();
        } catch (error) {
            logger.error('Authentication error:', error);
            if (error.name === 'JsonWebTokenError') {
                next(new UnauthorizedError('Invalid token'));
            } else if (error.name === 'TokenExpiredError') {
                next(new UnauthorizedError('Token has expired'));
            } else {
                next(error);
            }
        }
    };
};

module.exports = auth;

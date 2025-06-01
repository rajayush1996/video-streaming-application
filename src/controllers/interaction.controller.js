const InteractionService = require('../services/interaction.service');
// const { ApiError } = require('../features/error');
const httpStatus = require('http-status');
const logger = require('../features/logger');

class InteractionController {
    /**
     * Record a new interaction
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async recordInteraction(req, res, next) {
        try {
            const interactionData = {
                ...req.body,
                userId: req.user.id
            };
            const interaction = await InteractionService.recordInteraction(interactionData);
            res.status(httpStatus.CREATED).json(interaction);
        } catch (error) {
            logger.error('Error recording interaction:', error);
            next(error);
        }
    }

    /**
     * Get unread interactions count
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getUnreadCount(req, res, next) {
        try {
            const count = await InteractionService.getUnreadCount(req.user.id);
            res.json({ count });
        } catch (error) {
            logger.error('Error getting unread count:', error);
            next(error);
        }
    }

    /**
     * Get recent interactions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getRecentInteractions(req, res, next) {
        try {
            const { page, limit } = req.query;
            const interactions = await InteractionService.getRecentInteractions(req.user.id, {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10)
            });
            res.json(interactions);
        } catch (error) {
            logger.error('Error getting recent interactions:', error);
            next(error);
        }
    }

    /**
     * Get interactions for a specific target
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getInteractionsByTarget(req, res, next) {
        try {
            const { targetId, targetType } = req.params;
            const { page, limit } = req.query;
            const interactions = await InteractionService.getInteractionsByTarget(
                targetId,
                targetType,
                {
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10)
                }
            );
            res.json(interactions);
        } catch (error) {
            logger.error('Error getting target interactions:', error);
            next(error);
        }
    }

    /**
     * Mark interactions as read
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async markAsRead(req, res, next) {
        try {
            const { interactionIds } = req.body;
            await InteractionService.markAsRead(req.user.id, interactionIds);
            res.status(httpStatus.NO_CONTENT).send();
        } catch (error) {
            logger.error('Error marking interactions as read:', error);
            next(error);
        }
    }

    /**
     * Archive interactions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async archiveInteractions(req, res, next) {
        try {
            const { interactionIds } = req.body;
            await InteractionService.archiveInteractions(req.user.id, interactionIds);
            res.status(httpStatus.NO_CONTENT).send();
        } catch (error) {
            logger.error('Error archiving interactions:', error);
            next(error);
        }
    }

    /**
     * Get user's activity feed
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getActivityFeed(req, res, next) {
        try {
            const { page, limit } = req.query;
            const feed = await InteractionService.getActivityFeed(req.user.id, {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10)
            });
            res.json(feed);
        } catch (error) {
            logger.error('Error getting activity feed:', error);
            next(error);
        }
    }
}

module.exports = InteractionController; 
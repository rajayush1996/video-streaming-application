const eventBusService = require('./eventBus.service');
const logger = require('../features/logger');

/**
 * Publish video created event
 * @param {Object} video - The video document
 * @returns {Promise<boolean>} Success status
 */
exports.publishVideoCreated = async (video) => {
    try {
        const eventData = {
            type: 'VIDEO_CREATED',
            data: {
                videoId: video._id,
                title: video.title,
                author: video.author,
                category: video.category,
                status: video.status,
                createdAt: video.createdAt
            }
        };

        await eventBusService.publish('video.events', eventData);
        logger.info(`Video created event published for video ID: ${video._id}`);
        return true;
    } catch (error) {
        logger.error('Error publishing video created event:', error);
        return false;
    }
};

/**
 * Publish video updated event
 * @param {Object} video - The video document
 * @returns {Promise<boolean>} Success status
 */
exports.publishVideoUpdated = async (video) => {
    try {
        const eventData = {
            type: 'VIDEO_UPDATED',
            data: {
                videoId: video._id,
                title: video.title,
                author: video.author,
                category: video.category,
                status: video.status,
                updatedAt: video.updatedAt
            }
        };

        await eventBusService.publish('video.events', eventData);
        logger.info(`Video updated event published for video ID: ${video._id}`);
        return true;
    } catch (error) {
        logger.error('Error publishing video updated event:', error);
        return false;
    }
};

/**
 * Publish video deleted event
 * @param {string} videoId - The video ID
 * @returns {Promise<boolean>} Success status
 */
exports.publishVideoDeleted = async (videoId) => {
    try {
        const eventData = {
            type: 'VIDEO_DELETED',
            data: {
                videoId,
                deletedAt: new Date()
            }
        };

        await eventBusService.publish('video.events', eventData);
        logger.info(`Video deleted event published for video ID: ${videoId}`);
        return true;
    } catch (error) {
        logger.error('Error publishing video deleted event:', error);
        return false;
    }
};

/**
 * Publish video status changed event
 * @param {Object} video - The video document
 * @param {string} oldStatus - The previous status
 * @param {string} newStatus - The new status
 * @returns {Promise<boolean>} Success status
 */
exports.publishVideoStatusChanged = async (video, oldStatus, newStatus) => {
    try {
        const eventData = {
            type: 'VIDEO_STATUS_CHANGED',
            data: {
                videoId: video._id,
                title: video.title,
                author: video.author,
                oldStatus,
                newStatus,
                updatedAt: video.updatedAt
            }
        };

        await eventBusService.publish('video.events', eventData);
        logger.info(`Video status changed event published for video ID: ${video._id}`);
        return true;
    } catch (error) {
        logger.error('Error publishing video status changed event:', error);
        return false;
    }
};

/**
 * Publish video interaction event
 * @param {string} videoId - The video ID
 * @param {string} userId - The user ID
 * @param {string} interactionType - The type of interaction (like, comment, view)
 * @param {Object} [interactionData] - Additional interaction data
 * @returns {Promise<boolean>} Success status
 */
exports.publishVideoInteraction = async (videoId, userId, interactionType, interactionData = {}) => {
    try {
        const eventData = {
            type: 'VIDEO_INTERACTION',
            data: {
                videoId,
                userId,
                interactionType,
                ...interactionData,
                timestamp: new Date()
            }
        };

        await eventBusService.publish('video.events', eventData);
        logger.info(`Video interaction event published for video ID: ${videoId}`);
        return true;
    } catch (error) {
        logger.error('Error publishing video interaction event:', error);
        return false;
    }
}; 
const rabbitmqService = require('./rabbitmq.service');
const logger = require('../features/logger');

const QUEUE = 'view.update';

class ViewEventService {
    /**
     * Publish a view increment event
     * @param {string} mediaId
     * @returns {Promise<boolean>}
     */
    async publishViewIncrement(mediaId) {
        try {
            const message = { mediaId, timestamp: new Date().toISOString() };
            return await rabbitmqService.publish(QUEUE, message);
        } catch (error) {
            logger.error('Failed to publish view increment event:', error);
            return false;
        }
    }

    /**
     * Subscribe to view increment events
     * @param {Function} callback
     * @returns {Promise<void>}
     */
    async subscribe(callback) {
        try {
            await rabbitmqService.subscribe(QUEUE, callback);
        } catch (error) {
            logger.error('Failed to subscribe to view increment events:', error);
        }
    }
}

module.exports = new ViewEventService();

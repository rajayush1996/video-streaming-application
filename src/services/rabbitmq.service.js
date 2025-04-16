const amqp = require('amqplib');
const config = require('../../config');
const logger = require('../features/logger');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.connected = false;
    }

    /**
     * Connect to RabbitMQ
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.connected) return;

        try {
            const { host, port, user, password } = config.rabbitmq;
            const url = `amqp://${user}:${password}@${host}:${port}`;
            
            this.connection = await amqp.connect(url);
            this.channel = await this.connection.createChannel();
            this.connected = true;
            
            logger.info('Connected to RabbitMQ');
            
            // Handle connection errors
            this.connection.on('error', (err) => {
                logger.error('RabbitMQ connection error:', err);
                this.connected = false;
                // Attempt to reconnect after a delay
                setTimeout(() => this.connect(), 5000);
            });
            
            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed');
                this.connected = false;
                // Attempt to reconnect after a delay
                setTimeout(() => this.connect(), 5000);
            });
        } catch (error) {
            logger.error('Failed to connect to RabbitMQ:', error);
            this.connected = false;
            // Attempt to reconnect after a delay
            setTimeout(() => this.connect(), 5000);
        }
    }

    /**
     * Publish a message to a queue
     * @param {string} queue - Queue name
     * @param {Object} message - Message to publish
     * @returns {Promise<boolean>} - Success status
     */
    async publish(queue, message) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            
            // Ensure the queue exists
            await this.channel.assertQueue(queue, { durable: true });
            
            // Publish the message
            const success = this.channel.sendToQueue(
                queue,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );
            
            logger.info(`Published message to queue: ${queue}`);
            return success;
        } catch (error) {
            logger.error(`Failed to publish message to queue ${queue}:`, error);
            return false;
        }
    }

    /**
     * Subscribe to a queue
     * @param {string} queue - Queue name
     * @param {Function} callback - Callback function to handle messages
     * @returns {Promise<void>}
     */
    async subscribe(queue, callback) {
        try {
            if (!this.connected) {
                await this.connect();
            }
            
            // Ensure the queue exists
            await this.channel.assertQueue(queue, { durable: true });
            
            // Set prefetch to 1 to ensure fair distribution
            await this.channel.prefetch(1);
            
            // Consume messages
            this.channel.consume(queue, async (msg) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        await callback(content);
                        
                        // Acknowledge the message
                        this.channel.ack(msg);
                        logger.info(`Processed message from queue: ${queue}`);
                    } catch (error) {
                        logger.error(`Error processing message from queue ${queue}:`, error);
                        // Reject the message and requeue it
                        this.channel.nack(msg, false, true);
                    }
                }
            });
            
            logger.info(`Subscribed to queue: ${queue}`);
        } catch (error) {
            logger.error(`Failed to subscribe to queue ${queue}:`, error);
        }
    }

    /**
     * Close the connection
     * @returns {Promise<void>}
     */
    async close() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.connected = false;
            logger.info('Closed RabbitMQ connection');
        } catch (error) {
            logger.error('Error closing RabbitMQ connection:', error);
        }
    }
}

// Export a singleton instance
module.exports = new RabbitMQService(); 
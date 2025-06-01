const NotificationEvent = require('../models/notificationEvent.model');
const logger = require('../features/logger');

/**
 * Event Bus Service - Handles publishing, subscribing, and processing events
 * Follows a publish-subscribe pattern with MongoDB-based event storage and processing
 * Features:
 * - Event publishing with priority and scheduling
 * - Subscription management for event handlers
 */
class EventBusService {
    constructor() {
        this.subscribers = {};
        this.isPolling = false;
        this.pollingInterval = 5000; // 5 seconds
        this.batchSize = 50;
    }

    /**
     * Initialize the event bus
     */
    initialize() {
        // Start polling for pending events
        this.startPolling();
        logger.info('Event Bus Service initialized');
    }

    /**
     * Publish an event to the event bus
     * @param {string} eventType - Type of event
     * @param {Object} payload - Event payload
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} - Created event
     */
    async publish(eventType, payload, options = {}) {
        try {
            const {
                priority = 'medium',
                publisher = 'system',
                targetUsers = [],
                metadata = {},
                scheduledFor = new Date(),
            } = options;

            const event = await NotificationEvent.create({
                eventType,
                payload,
                priority,
                publisher,
                targetUsers,
                metadata,
                scheduledFor,
                processingStatus: 'pending',
            });

            logger.info(`Event published: ${eventType} with ID ${event._id}`);
            
            // Attempt immediate processing if high priority
            if (priority === 'critical' || priority === 'high') {
                this.processEvent(event);
            }

            return event.toObject();
        } catch (error) {
            logger.error(`Error publishing event: ${error.message}`);
            throw error;
        }
    }

    /**
     * Subscribe to a specific event type
     * @param {string} eventType - Type of event to subscribe to
     * @param {Function} callback - Function to be called when event occurs
     * @returns {string} - Subscription ID
     */
    subscribe(eventType, callback) {
        const id = Date.now().toString() + Math.random().toString(36).substring(2, 15);
        
        if (!this.subscribers[eventType]) {
            this.subscribers[eventType] = [];
        }
        
        this.subscribers[eventType].push({
            id,
            callback,
        });
        
        logger.info(`Added subscriber to ${eventType} with ID ${id}`);
        return id;
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventType - Type of event
     * @param {string} subscriptionId - Subscription ID
     * @returns {boolean} - Whether unsubscription was successful
     */
    unsubscribe(eventType, subscriptionId) {
        if (!this.subscribers[eventType]) {
            return false;
        }
        
        const initialLength = this.subscribers[eventType].length;
        this.subscribers[eventType] = this.subscribers[eventType].filter(
            (sub) => sub.id !== subscriptionId
        );
        
        const removed = initialLength > this.subscribers[eventType].length;
        
        if (removed) {
            logger.info(`Removed subscriber from ${eventType} with ID ${subscriptionId}`);
        }
        
        return removed;
    }

    /**
     * Start polling for pending events
     */
    startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        
        const poll = async () => {
            if (!this.isPolling) return;
            
            try {
                // Get events that are scheduled for now or earlier, ordered by priority and creation time
                const events = await NotificationEvent.find({
                    processingStatus: 'pending',
                    scheduledFor: { $lte: new Date() }
                })
                    .sort({ priority: 1, createdAt: 1 })
                    .limit(this.batchSize);
                
                if (events.length > 0) {
                    logger.info(`Processing ${events.length} pending events`);
                    
                    // Process events in sequence
                    for (const event of events) {
                        await this.processEvent(event);
                    }
                }
            } catch (error) {
                logger.error(`Error polling events: ${error.message}`);
            }
            
            // Schedule next poll
            setTimeout(poll, this.pollingInterval);
        };
        
        // Start polling
        poll();
    }

    /**
     * Stop polling for events
     */
    stopPolling() {
        this.isPolling = false;
        logger.info('Event polling stopped');
    }

    /**
     * Process a single event
     * @param {Object} event - Event to process
     */
    async processEvent(event) {
        try {
            // Mark event as processing
            event.processingStatus = 'processing';
            event.attempts += 1;
            await event.save();
            
            // Check if we have subscribers for this event type
            const subscribers = this.subscribers[event.eventType] || [];
            
            if (subscribers.length === 0) {
                logger.warn(`No subscribers for event type: ${event.eventType}`);
                event.processingStatus = 'completed';
                event.processedAt = new Date();
                await event.save();
                return;
            }
            
            // Notify all subscribers
            const promises = subscribers.map(({ callback }) => {
                return new Promise(async (resolve) => {
                    try {
                        await callback(event);
                        resolve(true);
                    } catch (error) {
                        logger.error(`Error in event handler: ${error.message}`);
                        resolve(false);
                    }
                });
            });
            
            // Wait for all subscribers to process
            const results = await Promise.all(promises);
            
            // If all subscribers processed successfully, mark as completed
            if (results.every((result) => result)) {
                event.processingStatus = 'completed';
            } else {
                // If this is the first few attempts, retry later
                if (event.attempts < 3) {
                    event.processingStatus = 'pending';
                    event.scheduledFor = new Date(Date.now() + 60000 * Math.pow(2, event.attempts - 1)); // Exponential backoff
                } else {
                    event.processingStatus = 'failed';
                    event.errorDetails = 'Failed after maximum retry attempts';
                }
            }
            
            event.processedAt = new Date();
            await event.save();
        } catch (error) {
            logger.error(`Error processing event ${event._id}: ${error.message}`);
            
            // Update event status
            try {
                event.processingStatus = 'failed';
                event.errorDetails = error.message;
                event.processedAt = new Date();
                await event.save();
            } catch (saveError) {
                logger.error(`Error updating event status: ${saveError.message}`);
            }
        }
    }
}

module.exports = new EventBusService(); 
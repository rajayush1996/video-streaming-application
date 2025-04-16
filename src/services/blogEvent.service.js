const rabbitmqService = require('./rabbitmq.service');
const logger = require('../features/logger');

// Define queue names
const QUEUES = {
    BLOG_CREATED: 'blog.created',
    BLOG_UPDATED: 'blog.updated',
    BLOG_PUBLISHED: 'blog.published',
    BLOG_DELETED: 'blog.deleted',
    BLOG_NOTIFICATION: 'blog.notification'
};

class BlogEventService {
    /**
     * Publish a blog created event
     * @param {Object} blog - The created blog
     * @returns {Promise<boolean>} - Success status
     */
    async publishBlogCreated(blog) {
        try {
            const message = {
                event: 'blog.created',
                timestamp: new Date(),
                data: {
                    blogId: blog._id,
                    title: blog.title,
                    author: blog.author,
                    status: blog.status,
                    createdAt: blog.createdAt
                }
            };
            
            return await rabbitmqService.publish(QUEUES.BLOG_CREATED, message);
        } catch (error) {
            logger.error('Failed to publish blog created event:', error);
            return false;
        }
    }
    
    /**
     * Publish a blog updated event
     * @param {Object} blog - The updated blog
     * @returns {Promise<boolean>} - Success status
     */
    async publishBlogUpdated(blog) {
        try {
            const message = {
                event: 'blog.updated',
                timestamp: new Date(),
                data: {
                    blogId: blog._id,
                    title: blog.title,
                    author: blog.author,
                    status: blog.status,
                    updatedAt: blog.updatedAt
                }
            };
            
            return await rabbitmqService.publish(QUEUES.BLOG_UPDATED, message);
        } catch (error) {
            logger.error('Failed to publish blog updated event:', error);
            return false;
        }
    }
    
    /**
     * Publish a blog published event
     * @param {Object} blog - The published blog
     * @returns {Promise<boolean>} - Success status
     */
    async publishBlogPublished(blog) {
        try {
            const message = {
                event: 'blog.published',
                timestamp: new Date(),
                data: {
                    blogId: blog._id,
                    title: blog.title,
                    author: blog.author,
                    publishDate: blog.publishDate
                }
            };
            
            // Publish to the blog.published queue
            await rabbitmqService.publish(QUEUES.BLOG_PUBLISHED, message);
            
            // Also publish to the notification queue for user notifications
            const notificationMessage = {
                event: 'blog.notification',
                timestamp: new Date(),
                data: {
                    type: 'blog_published',
                    blogId: blog._id,
                    title: blog.title,
                    author: blog.author,
                    publishDate: blog.publishDate
                }
            };
            
            return await rabbitmqService.publish(QUEUES.BLOG_NOTIFICATION, notificationMessage);
        } catch (error) {
            logger.error('Failed to publish blog published event:', error);
            return false;
        }
    }
    
    /**
     * Publish a blog deleted event
     * @param {string} blogId - The ID of the deleted blog
     * @param {string} authorId - The ID of the blog author
     * @returns {Promise<boolean>} - Success status
     */
    async publishBlogDeleted(blogId, authorId) {
        try {
            const message = {
                event: 'blog.deleted',
                timestamp: new Date(),
                data: {
                    blogId,
                    authorId
                }
            };
            
            return await rabbitmqService.publish(QUEUES.BLOG_DELETED, message);
        } catch (error) {
            logger.error('Failed to publish blog deleted event:', error);
            return false;
        }
    }
    
    /**
     * Subscribe to blog events
     * @param {string} eventType - The type of event to subscribe to
     * @param {Function} callback - Callback function to handle the event
     * @returns {Promise<void>}
     */
    async subscribeToBlogEvents(eventType, callback) {
        try {
            const queue = QUEUES[eventType.toUpperCase()];
            if (!queue) {
                throw new Error(`Invalid event type: ${eventType}`);
            }
            
            await rabbitmqService.subscribe(queue, callback);
        } catch (error) {
            logger.error(`Failed to subscribe to blog event ${eventType}:`, error);
        }
    }
}

module.exports = new BlogEventService(); 
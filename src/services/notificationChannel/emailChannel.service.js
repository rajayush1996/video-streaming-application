const logger = require('../../features/logger');
const RateLimiter = require('../../utils/rateLimiter.util');

/**
 * Email Channel Service
 * Handles sending notifications via email
 * Includes rate limiting to prevent overwhelming email providers
 */
class EmailChannelService {
    constructor() {
        // Rate limiter configuration
        this.rateLimiter = new RateLimiter({
            // Limit to 100 emails per minute
            tokensPerInterval: 100,
            interval: 'minute',
            // Burst allowance of 20 emails
            fireImmediately: true
        });

        // Queue for emails when rate limit is hit
        this.emailQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Send an email notification
     * @param {Object} params - Email parameters
     * @param {string} params.to - Recipient email
     * @param {string} params.subject - Email subject
     * @param {string} params.body - Email body text
     * @param {string} params.htmlBody - HTML email content
     * @param {string} params.templateId - Email template ID (optional)
     * @param {Object} params.templateData - Template variables (optional)
     * @returns {Promise<Object>} - Send result
     */
    async send(params) {
        try {
            const { to, subject } = params;
            
            // Check rate limit
            const rateLimitResult = await this.rateLimiter.tryConsume(1);
            
            if (!rateLimitResult.success) {
                logger.warn(`Email rate limit hit. Queuing email to ${to}`);
                return this.queueEmail(params);
            }
            
            // In a real implementation, you would call your email provider's API here
            logger.info(`Sending email to ${to}: ${subject}`);
            
            // Simulate sending email
            const result = await this.mockSendEmail(params);
            
            return {
                success: true,
                messageId: result.messageId,
                provider: 'mock',
            };
        } catch (error) {
            logger.error(`Error sending email: ${error.message}`);
            throw error;
        }
    }

    /**
     * Queue an email for later delivery (when rate limit is no longer hit)
     * @param {Object} emailParams - Email parameters
     * @returns {Promise<Object>} - Queue result
     */
    async queueEmail(emailParams) {
        // Add to queue
        this.emailQueue.push({
            params: emailParams,
            timestamp: new Date(),
        });
        
        // Start processing queue if not already
        if (!this.isProcessingQueue) {
            this.processQueue();
        }
        
        return {
            success: false,
            queued: true,
            queuePosition: this.emailQueue.length,
        };
    }

    /**
     * Process the email queue
     */
    async processQueue() {
        if (this.isProcessingQueue || this.emailQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        const processNext = async () => {
            if (this.emailQueue.length === 0) {
                this.isProcessingQueue = false;
                return;
            }
            
            const { params } = this.emailQueue[0];
            
            try {
                // Check rate limit
                const rateLimitResult = await this.rateLimiter.tryConsume(1);
                
                if (rateLimitResult.success) {
                    // Remove from queue
                    this.emailQueue.shift();
                    
                    // Send email
                    await this.mockSendEmail(params);
                    logger.info(`Sent queued email to ${params.to}`);
                    
                    // Process next email after a small delay
                    setTimeout(processNext, 200);
                } else {
                    // Wait for rate limit to reset
                    const waitTime = Math.max(1000, rateLimitResult.msBeforeNext);
                    logger.info(`Rate limit still hit. Waiting ${waitTime}ms before retrying queue.`);
                    setTimeout(processNext, waitTime);
                }
            } catch (error) {
                logger.error(`Error processing queued email: ${error.message}`);
                
                // Remove failed email from queue
                this.emailQueue.shift();
                
                // Continue with next
                setTimeout(processNext, 200);
            }
        };
        
        // Start processing
        processNext();
    }

    /**
     * Mock sending an email (for development/testing)
     * @param {Object} params - Email parameters
     * @returns {Promise<Object>} - Mock result
     */
    async mockSendEmail(params) {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 100));
        
        logger.debug(`MOCK EMAIL:
          To: ${params.to}
          Subject: ${params.subject}
          Body: ${params.body.substring(0, 100)}...
        `);
        
        return {
            messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            timestamp: new Date(),
        };
    }
}

module.exports = new EmailChannelService(); 
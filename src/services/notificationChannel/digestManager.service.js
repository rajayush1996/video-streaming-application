const logger = require('../../features/logger');
const NotificationSetting = require('../../models/notificationSetting.model');
const Notification = require('../../models/notification.model');
const User = require('../../models/user.model');
const emailChannel = require('./emailChannel.service');
const { formatDate } = require('../../utils/formatDate.util');

/**
 * Digest Manager Service
 * Handles aggregation and delivery of notification digests (daily, weekly)
 * with smart scheduling and templating
 */
class DigestManagerService {
    constructor() {
        this.isRunning = false;
        this.digestJobs = {};
    }

    /**
     * Initialize digest manager
     */
    initialize() {
        // Schedule the main daily digest job
        this.scheduleDigestJobs();
        logger.info('Digest Manager Service initialized');
    }

    /**
     * Schedule all digest jobs
     */
    scheduleDigestJobs() {
        // Schedule daily digest job (e.g., runs at 8 AM every day)
        this.scheduleJob('daily', '08:00', this.processDailyDigests.bind(this));
        
        // Schedule weekly digest job (e.g., runs at 9 AM every Monday)
        this.scheduleJob('weekly', '09:00', this.processWeeklyDigests.bind(this), 1); // 1 = Monday
    }

    /**
     * Schedule a recurring job
     * @param {string} name - Job name
     * @param {string} time - Time in HH:MM format
     * @param {Function} handler - Function to execute
     * @param {number} dayOfWeek - Day of week (0-6, 0 = Sunday) for weekly jobs
     */
    scheduleJob(name, time, handler, dayOfWeek = null) {
        // Parse time
        const [hours, minutes] = time.split(':').map(Number);
        
        // Calculate initial delay
        const now = new Date();
        const targetTime = new Date(now);
        targetTime.setHours(hours, minutes, 0, 0);
        
        // If target time is in the past, schedule for tomorrow
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        // For weekly jobs, adjust to the correct day of the week
        if (dayOfWeek !== null) {
            const currentDay = targetTime.getDay();
            const daysToAdd = (dayOfWeek - currentDay + 7) % 7;
            
            if (daysToAdd > 0) {
                targetTime.setDate(targetTime.getDate() + daysToAdd);
            }
        }
        
        // Calculate delay in milliseconds
        const delay = targetTime.getTime() - now.getTime();
        
        // Schedule the job
        const jobId = setTimeout(() => {
            // Run the handler
            handler();
            
            // Reschedule for next occurrence
            if (dayOfWeek !== null) {
                // Weekly job - schedule for next week
                this.scheduleJob(name, time, handler, dayOfWeek);
            } else {
                // Daily job - schedule for tomorrow
                this.scheduleJob(name, time, handler);
            }
        }, delay);
        
        // Store job ID for potential cancellation
        this.digestJobs[name] = jobId;
        
        logger.info(`Scheduled ${name} digest job for ${targetTime.toISOString()}`);
    }

    /**
     * Process daily digests for all users with this preference
     */
    async processDailyDigests() {
        if (this.isRunning) {
            logger.warn('Daily digest processing already in progress, skipping');
            return;
        }
        
        this.isRunning = true;
        
        try {
            logger.info('Processing daily digests');
            
            // Find users with daily digest preference for any channel
            const userSettings = await NotificationSetting.find({
                $or: [
                    { 'channels.email.frequency': 'digest', 'digestSettings.frequency': 'daily' },
                    { 'channels.push.frequency': 'digest', 'digestSettings.frequency': 'daily' }
                ]
            });
            
            logger.info(`Found ${userSettings.length} users with daily digest preference`);
            
            // Process each user's digest
            for (const settings of userSettings) {
                await this.processUserDigest(settings.userId, 'daily');
            }
            
            logger.info('Daily digest processing completed');
        } catch (error) {
            logger.error(`Error processing daily digests: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process weekly digests for all users with this preference
     */
    async processWeeklyDigests() {
        if (this.isRunning) {
            logger.warn('Weekly digest processing already in progress, skipping');
            return;
        }
        
        this.isRunning = true;
        
        try {
            logger.info('Processing weekly digests');
            
            // Find users with weekly digest preference for any channel
            const userSettings = await NotificationSetting.find({
                $or: [
                    { 'channels.email.frequency': 'digest', 'digestSettings.frequency': 'weekly' },
                    { 'channels.push.frequency': 'digest', 'digestSettings.frequency': 'weekly' }
                ]
            });
            
            logger.info(`Found ${userSettings.length} users with weekly digest preference`);
            
            // Process each user's digest
            for (const settings of userSettings) {
                await this.processUserDigest(settings.userId, 'weekly');
            }
            
            logger.info('Weekly digest processing completed');
        } catch (error) {
            logger.error(`Error processing weekly digests: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Process digest for a specific user
     * @param {string} userId - User ID
     * @param {string} frequency - 'daily' or 'weekly'
     */
    async processUserDigest(userId, frequency) {
        try {
            // Get user data
            const user = await User.findById(userId);
            
            if (!user) {
                logger.warn(`User not found for digest: ${userId}`);
                return;
            }
            
            // Get user settings
            const settings = await NotificationSetting.findOne({ userId });
            
            if (!settings) {
                logger.warn(`Settings not found for digest: ${userId}`);
                return;
            }
            
            // Calculate date range
            const now = new Date();
            const startDate = new Date(now);
            
            if (frequency === 'daily') {
                startDate.setDate(startDate.getDate() - 1);
            } else if (frequency === 'weekly') {
                startDate.setDate(startDate.getDate() - 7);
            }
            
            // Find all notifications for this user in the date range
            const notifications = await Notification.find({
                recipient: userId,
                isDeleted: false,
                createdAt: { $gte: startDate, $lte: now }
            }).sort({ createdAt: -1 }).lean().exec();
            
            if (notifications.length === 0) {
                logger.info(`No notifications found for user digest: ${userId}`);
                return;
            }
            
            // Group notifications by type
            const groupedNotifications = this.groupNotificationsByType(notifications);
            
            // Send digest to appropriate channels
            await this.sendDigestToChannels(user, settings, groupedNotifications, frequency);
            
            logger.info(`Processed ${frequency} digest for user: ${userId}`);
        } catch (error) {
            logger.error(`Error processing user digest for ${userId}: ${error.message}`);
        }
    }

    /**
     * Group notifications by type for better presentation
     * @param {Array} notifications - List of notifications
     * @returns {Object} - Grouped notifications
     */
    groupNotificationsByType(notifications) {
        const grouped = {};
        
        for (const notification of notifications) {
            const type = notification.type;
            
            if (!grouped[type]) {
                grouped[type] = [];
            }
            
            grouped[type].push(notification);
        }
        
        return grouped;
    }

    /**
     * Send digest to all appropriate channels based on user settings
     * @param {Object} user - User data
     * @param {Object} settings - User notification settings
     * @param {Object} groupedNotifications - Grouped notifications by type
     * @param {string} frequency - 'daily' or 'weekly'
     */
    async sendDigestToChannels(user, settings, groupedNotifications, frequency) {
        // Prepare digest content
        const digestContent = this.prepareDigestContent(user, groupedNotifications, frequency);
        
        // Send to email channel if enabled for digests
        if (
            settings.channels.email.enabled &&
            settings.channels.email.frequency === 'digest' &&
            settings.digestSettings.frequency === frequency
        ) {
            await this.sendEmailDigest(user, digestContent, frequency);
        }
        
        // Send to push channel if enabled for digests
        if (
            settings.channels.push.enabled &&
            settings.channels.push.frequency === 'digest' &&
            settings.digestSettings.frequency === frequency
        ) {
            // This would call a push notification service
            // await this.sendPushDigest(user, digestContent, frequency);
        }
    }

    /**
     * Prepare digest content
     * @param {Object} user - User data
     * @param {Object} groupedNotifications - Grouped notifications
     * @param {string} frequency - 'daily' or 'weekly'
     * @returns {Object} - Digest content for different channels
     */
    prepareDigestContent(user, groupedNotifications, frequency) {
        const today = new Date();
        const formattedDate = formatDate(today);
        
        const periodText = frequency === 'daily' ? 'Daily' : 'Weekly';
        const title = `${periodText} Activity Summary - ${formattedDate}`;
        
        // Count total notifications
        let totalCount = 0;
        Object.values(groupedNotifications).forEach(group => {
            totalCount += group.length;
        });
        
        // Prepare email content
        let emailBodyHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>${title}</h2>
                <p>Hello ${user.name || user.username},</p>
                <p>Here's a summary of your ${frequency} activity:</p>
            </div>
        `;
        
        // Add notification groups
        for (const [type, notifications] of Object.entries(groupedNotifications)) {
            const groupTitle = this.getGroupTitle(type);
            
            emailBodyHtml += `
                <div style="margin: 20px 0;">
                    <h3 style="margin-bottom: 10px;">${groupTitle} (${notifications.length})</h3>
                    <ul style="padding-left: 20px;">
            `;
            
            // Add up to 5 notifications from each group
            const displayCount = Math.min(notifications.length, 5);
            
            for (let i = 0; i < displayCount; i++) {
                const notification = notifications[i];
                emailBodyHtml += `
                    <li style="margin-bottom: 5px;">
                        ${notification.title}: ${notification.message}
                    </li>
                `;
            }
            
            // If there are more notifications, add a "more" message
            if (notifications.length > displayCount) {
                emailBodyHtml += `
                    <li style="margin-top: 10px;">
                        And ${notifications.length - displayCount} more ${groupTitle.toLowerCase()}...
                    </li>
                `;
            }
            
            emailBodyHtml += `
                    </ul>
                </div>
            `;
        }
        
        // Add footer
        emailBodyHtml += `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p>You received this email because you've subscribed to ${frequency} digest notifications.</p>
                <p>To change your notification preferences, visit your <a href="#">account settings</a>.</p>
            </div>
        `;
        
        const emailBodyText = `
            ${title}
            
            Hello ${user.name || user.username},
            
            Here's a summary of your ${frequency} activity:
            
            ${Object.entries(groupedNotifications).map(([type, notifications]) => {
                const groupTitle = this.getGroupTitle(type);
                return `
                ${groupTitle} (${notifications.length})
                ${notifications.slice(0, 5).map(n => `- ${n.title}: ${n.message}`).join('\n')}
                ${notifications.length > 5 ? `And ${notifications.length - 5} more ${groupTitle.toLowerCase()}...` : ''}
                `;
            }).join('\n\n')}
            
            You received this email because you've subscribed to ${frequency} digest notifications.
            To change your notification preferences, visit your account settings.
        `;
        
        return {
            email: {
                subject: title,
                bodyHtml: emailBodyHtml,
                bodyText: emailBodyText
            },
            push: {
                title: title,
                body: `You have ${totalCount} new notifications in your ${frequency} digest.`
            }
        };
    }

    /**
     * Get human-readable group title based on notification type
     * @param {string} type - Notification type
     * @returns {string} - Group title
     */
    getGroupTitle(type) {
        const titles = {
            'content-approval': 'Content Approvals',
            'content-rejection': 'Content Rejections',
            'new-comment': 'Comments',
            'new-like': 'Likes',
            'new-follower': 'New Followers',
            'system': 'System Notifications'
        };
        
        return titles[type] || 'Other Notifications';
    }

    /**
     * Send email digest
     * @param {Object} user - User data
     * @param {Object} digestContent - Digest content
     * @param {string} frequency - 'daily' or 'weekly'
     */
    async sendEmailDigest(user, digestContent, frequency) {
        try {
            await emailChannel.send({
                to: user.email,
                subject: digestContent.email.subject,
                body: digestContent.email.bodyText,
                htmlBody: digestContent.email.bodyHtml
            });
            
            logger.info(`Sent ${frequency} digest email to user: ${user._id}`);
        } catch (error) {
            logger.error(`Error sending digest email to ${user._id}: ${error.message}`);
        }
    }

    /**
     * Stop all scheduled digest jobs
     */
    stop() {
        for (const [name, jobId] of Object.entries(this.digestJobs)) {
            clearTimeout(jobId);
            logger.info(`Stopped ${name} digest job`);
        }
        
        this.digestJobs = {};
    }
}

module.exports = new DigestManagerService(); 
const NotificationTemplate = require('../models/notificationTemplate.model');
const NotificationSetting = require('../models/notificationSetting.model');
const User = require('../models/user.model'); // Assuming you have a User model
const Notification = require('../models/notification.model');
const logger = require('../features/logger');
const eventBus = require('./eventBus.service');
const socketService = require('./socket.service');
const emailChannel = require('./notificationChannel/emailChannel.service');

/**
 * Service for processing notification events and sending them through various channels
 */
class NotificationProcessorService {
  constructor() {
    this.subscriptionIds = {};
    this.initialize();
  }

  /**
   * Initialize notification processor
   */
  initialize() {
    // Subscribe to relevant events
    this.subscribeToEvents();
    logger.info('Notification Processor Service initialized');
  }

  /**
   * Subscribe to all notification-related events
   */
  subscribeToEvents() {
    // Content related events
    this.subscriptionIds.contentApproval = eventBus.subscribe(
      'content.approved',
      this.handleContentApproved.bind(this)
    );
    
    this.subscriptionIds.contentRejection = eventBus.subscribe(
      'content.rejected',
      this.handleContentRejected.bind(this)
    );
    
    // User interaction events
    this.subscriptionIds.newComment = eventBus.subscribe(
      'content.newComment',
      this.handleNewComment.bind(this)
    );
    
    this.subscriptionIds.newLike = eventBus.subscribe(
      'content.newLike',
      this.handleNewLike.bind(this)
    );
    
    this.subscriptionIds.newFollower = eventBus.subscribe(
      'user.newFollower',
      this.handleNewFollower.bind(this)
    );
    
    // System events
    this.subscriptionIds.systemAnnouncement = eventBus.subscribe(
      'system.announcement',
      this.handleSystemAnnouncement.bind(this)
    );
  }

  /**
   * Process a notification event
   * @param {Object} event - Event object
   * @param {string} templateId - Template ID
   * @returns {Promise<Array>} - Results from various notification channels
   */
  async processNotification(event, templateId) {
    try {
      const { payload, targetUsers, priority } = event;
      
      // Fetch the notification template
      const template = await NotificationTemplate.findOne({ templateId, active: true });
      
      if (!template) {
        logger.error(`Template not found: ${templateId}`);
        throw new Error(`Template not found: ${templateId}`);
      }
      
      // Results for each channel
      const results = [];
      
      // Process each target user
      for (const userId of targetUsers) {
        // Get user settings
        const settings = await this.getUserSettings(userId);
        
        // Get user data
        const user = await User.findById(userId);
        
        if (!user) {
          logger.warn(`User not found for notification: ${userId}`);
          continue;
        }
        
        // Check if user is in quiet hours
        const isQuietHours = this.isInQuietHours(settings);
        
        // Prepare notification data with personalized content
        const notificationData = await this.prepareNotificationData(
          template,
          payload,
          user,
          settings.language || 'en'
        );
        
        // Common notification for tracking/persistence
        const notification = await this.createNotificationRecord(
          userId,
          payload.sender,
          template.eventType,
          notificationData,
          payload
        );
        
        // Determine which channels to use based on priority and settings
        const channels = this.determineChannels(
          priority,
          settings,
          isQuietHours,
          template
        );
        
        // Send through appropriate channels
        const channelResults = await this.sendThroughChannels(
          channels,
          user,
          notificationData,
          notification,
          settings
        );
        
        results.push({
          userId,
          notificationId: notification._id,
          channels: channelResults,
        });
      }
      
      return results;
    } catch (error) {
      logger.error(`Error processing notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user notification settings
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User settings
   */
  async getUserSettings(userId) {
    // Find or create user settings
    let settings = await NotificationSetting.findOne({ userId });
    
    if (!settings) {
      // Create default settings if not found
      settings = await NotificationSetting.create({
        userId,
      });
    }
    
    return settings;
  }

  /**
   * Check if current time is within user's quiet hours
   * @param {Object} settings - User settings
   * @returns {boolean} - Whether current time is in quiet hours
   */
  isInQuietHours(settings) {
    if (!settings.quietHours || !settings.quietHours.enabled) {
      return false;
    }
    
    // Get current time in user's timezone
    const now = new Date();
    const userTz = settings.quietHours.timezone || 'UTC';
    const userTime = now.toLocaleTimeString('en-US', { timeZone: userTz, hour12: false });
    
    // Extract hours and minutes
    const [hours, minutes] = userTime.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;
    
    // Convert quiet hours to minutes
    const startParts = settings.quietHours.start.split(':').map(Number);
    const endParts = settings.quietHours.end.split(':').map(Number);
    
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    
    // Check if current time is within quiet hours
    if (startMinutes < endMinutes) {
      // Normal case: quiet hours within the same day
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight case: quiet hours span midnight
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Prepare personalized notification data from template
   * @param {Object} template - Notification template
   * @param {Object} payload - Event payload
   * @param {Object} user - User data
   * @param {string} language - Language code
   * @returns {Promise<Object>} - Prepared notification data
   */
  async prepareNotificationData(template, payload, user, language = 'en') {
    const data = {};
    
    // Process each enabled channel in the template
    for (const channel of Object.keys(template.channels)) {
      const channelConfig = template.channels[channel];
      
      if (!channelConfig.enabled) {
        continue;
      }
      
      // Get content for the user's language or fall back to English
      const content = channelConfig.content[language] || channelConfig.content.en;
      
      if (!content) {
        continue;
      }
      
      // Replace placeholders in content with actual values
      data[channel] = this.replacePlaceholders(content, payload, user);
    }
    
    return data;
  }

  /**
   * Replace placeholders in content with actual values
   * @param {Object} content - Content with placeholders
   * @param {Object} payload - Event payload
   * @param {Object} user - User data
   * @returns {Object} - Content with replaced placeholders
   */
  replacePlaceholders(content, payload, user) {
    const result = { ...content };
    
    // Create a dictionary of replacements
    const replacements = {
      '{{userName}}': user.name || user.username,
      '{{userId}}': user._id.toString(),
      '{{userEmail}}': user.email,
      '{{contentTitle}}': payload.contentTitle || '',
      '{{contentId}}': payload.contentId || '',
      '{{senderName}}': payload.senderName || 'System',
      '{{timestamp}}': new Date().toISOString(),
      // Add more replacements as needed
    };
    
    // Add any custom placeholders from payload
    if (payload.placeholders) {
      for (const [key, value] of Object.entries(payload.placeholders)) {
        replacements[`{{${key}}}`] = value;
      }
    }
    
    // Replace placeholders in each string field
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string') {
        let replaced = value;
        
        // Replace all occurrences of each placeholder
        for (const [placeholder, replacement] of Object.entries(replacements)) {
          replaced = replaced.split(placeholder).join(replacement);
        }
        
        result[key] = replaced;
      } else if (typeof value === 'object' && value !== null) {
        // Recursively process nested objects
        result[key] = this.replacePlaceholders(value, payload, user);
      }
    }
    
    return result;
  }

  /**
   * Create a notification record in the database
   * @param {string} recipientId - Recipient user ID
   * @param {string} senderId - Sender user ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} payload - Event payload
   * @returns {Promise<Object>} - Created notification
   */
  async createNotificationRecord(recipientId, senderId, type, data, payload) {
    // Determine title and message from data
    const title = data.inApp?.title || data.push?.title || payload.title || type;
    const message = data.inApp?.body || data.push?.body || payload.message || '';
    
    // Determine related content
    const contentType = payload.contentType || 'system';
    const contentId = payload.contentId || payload._id || null;
    
    // Create the notification
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      relatedContent: {
        contentType,
        contentId,
      },
      metadata: payload.metadata || {},
    });
    
    return notification;
  }

  /**
   * Determine which channels to use based on priority and settings
   * @param {string} priority - Notification priority
   * @param {Object} settings - User settings
   * @param {boolean} isQuietHours - Whether it's quiet hours
   * @param {Object} template - Notification template
   * @returns {Object} - Enabled channels
   */
  determineChannels(priority, settings, isQuietHours, template) {
    const channels = {
      inApp: settings.channels.inApp.enabled && template.channels.inApp.enabled,
      push: settings.channels.push.enabled && template.channels.push.enabled,
      email: settings.channels.email.enabled && template.channels.email.enabled,
      sms: settings.channels.sms.enabled && template.channels.sms.enabled,
    };
    
    // If it's quiet hours, only critical notifications go through push/SMS
    if (isQuietHours && priority !== 'critical') {
      channels.push = false;
      channels.sms = false;
    }
    
    // For non-immediate frequencies, disable real-time channels
    if (settings.channels.email.frequency === 'digest') {
      channels.email = false;
    }
    
    if (settings.channels.push.frequency === 'digest') {
      channels.push = false;
    }
    
    // Critical notifications always go through all available channels
    if (priority === 'critical') {
      if (template.channels.push.enabled) channels.push = true;
      if (template.channels.email.enabled) channels.email = true;
      if (template.channels.sms.enabled) channels.sms = true;
    }
    
    return channels;
  }

  /**
   * Send notification through determined channels
   * @param {Object} channels - Enabled channels
   * @param {Object} user - User data
   * @param {Object} notificationData - Notification data
   * @param {Object} notification - Notification record
   * @param {Object} settings - User settings
   * @returns {Promise<Object>} - Results for each channel
   */
  async sendThroughChannels(channels, user, notificationData, notification, settings) {
    const results = {};
    
    // In-app notification (via socket)
    if (channels.inApp && notificationData.inApp) {
      try {
        socketService.emitToUser(
          user._id.toString(),
          'notification:new',
          {
            id: notification._id,
            type: notification.type,
            title: notificationData.inApp.title,
            message: notificationData.inApp.body,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
          }
        );
        
        results.inApp = { success: true };
      } catch (error) {
        logger.error(`Error sending in-app notification: ${error.message}`);
        results.inApp = { success: false, error: error.message };
      }
    }
    
    // Email notification
    if (channels.email && notificationData.email) {
      try {
        const emailResult = await emailChannel.send({
          to: user.email,
          subject: notificationData.email.subject,
          body: notificationData.email.body,
          htmlBody: notificationData.email.htmlTemplate,
        });
        
        results.email = emailResult;
      } catch (error) {
        logger.error(`Error sending email notification: ${error.message}`);
        results.email = { success: false, error: error.message };
      }
    }
    
    // We would add other channels like push, SMS, etc. here
    
    return results;
  }

  /**
   * Handle content approved event
   * @param {Object} event - Event object
   */
  async handleContentApproved(event) {
    try {
      const { payload } = event;
      
      // Process notification
      await this.processNotification(event, 'content-approved');
    } catch (error) {
      logger.error(`Error handling content approval: ${error.message}`);
    }
  }

  /**
   * Handle content rejected event
   * @param {Object} event - Event object
   */
  async handleContentRejected(event) {
    try {
      const { payload } = event;
      
      // Process notification
      await this.processNotification(event, 'content-rejected');
    } catch (error) {
      logger.error(`Error handling content rejection: ${error.message}`);
    }
  }

  /**
   * Handle new comment event
   * @param {Object} event - Event object
   */
  async handleNewComment(event) {
    try {
      const { payload } = event;
      
      // Process notification
      await this.processNotification(event, 'new-comment');
    } catch (error) {
      logger.error(`Error handling new comment: ${error.message}`);
    }
  }

  /**
   * Handle new like event
   * @param {Object} event - Event object
   */
  async handleNewLike(event) {
    try {
      const { payload } = event;
      
      // Process notification
      await this.processNotification(event, 'new-like');
    } catch (error) {
      logger.error(`Error handling new like: ${error.message}`);
    }
  }

  /**
   * Handle new follower event
   * @param {Object} event - Event object
   */
  async handleNewFollower(event) {
    try {
      const { payload } = event;
      
      // Process notification
      await this.processNotification(event, 'new-follower');
    } catch (error) {
      logger.error(`Error handling new follower: ${error.message}`);
    }
  }

  /**
   * Handle system announcement event
   * @param {Object} event - Event object
   */
  async handleSystemAnnouncement(event) {
    try {
      const { payload } = event;
      
      // Process notification
      await this.processNotification(event, 'system-announcement');
    } catch (error) {
      logger.error(`Error handling system announcement: ${error.message}`);
    }
  }
}

module.exports = new NotificationProcessorService(); 
const Notification = require('../models/notification.model');
const { formatApiResult } = require('../utils/formatApiResult.util');
const { ApiError } = require('../features/error');
const httpStatus = require('http-status');
const socketService = require('./socket.service');
const mongoose = require('mongoose');

class NotificationService {
  /**
   * Create a notification
   * @param {Object} notificationData
   * @param {boolean} emitSocket - Whether to emit socket event
   * @returns {Promise<Notification>}
   */
  async createNotification(notificationData, emitSocket = true) {
    try {
      const notification = await Notification.create(notificationData);
      
      if (emitSocket) {
        socketService.emitToUser(
          notificationData.recipient,
          'notification:new',
          notification
        );
      }
      
      return notification.toObject();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get notifications for a user with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt:desc',
      read,
      type,
      ...otherOptions
    } = options;

    const filter = {
      recipient: userId,
      isDeleted: false
    };

    if (read !== undefined) {
      filter.read = read === 'true' || read === true;
    }

    if (type) {
      filter.type = type;
    }

    const result = await Notification.paginate(filter, {
      page,
      limit,
      sortBy,
      lean: true,
      ...otherOptions
    });

    if (Array.isArray(result.results) && result.results.length) {
      result.results = formatApiResult(result.results);
    }

    return result;
  }

  /**
   * Mark notifications as read
   * @param {string} notificationId - Notification ID, or 'all' to mark all as read
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId, userId) {
    try {
      let result;
      
      if (notificationId === 'all') {
        result = await Notification.updateMany(
          { recipient: userId, read: false },
          { read: true }
        );
        
        return { success: true, count: result.modifiedCount };
      }
      
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });
      
      if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
      }
      
      notification.read = true;
      await notification.save();
      
      return notification.toObject();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @param {string} userId - User ID
   * @returns {Promise<Number>}
   */
  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false,
      isDeleted: false
    });
    
    return { count };
  }

  /**
   * Delete a notification (soft delete)
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
    }
    
    notification.isDeleted = true;
    notification.deletedAt = new Date();
    await notification.save();
    
    return { success: true };
  }

  /**
   * Create a content status notification (approval/rejection)
   * @param {string} userId - User ID
   * @param {string} contentId - Content ID
   * @param {string} status - 'approved' or 'rejected'
   * @param {Object} contentData - Content data
   * @returns {Promise<Notification>}
   */
  async createContentStatusNotification(userId, contentId, status, contentData) {
    const isApproved = status === 'approved';
    
    const notification = {
      recipient: userId,
      type: isApproved ? 'content-approval' : 'content-rejection',
      title: isApproved ? 'Content Approved' : 'Content Rejected',
      message: isApproved 
        ? `Your content "${contentData.title}" has been approved`
        : `Your content "${contentData.title}" has been rejected${contentData.rejectionReason ? `: ${contentData.rejectionReason}` : ''}`,
      relatedContent: {
        contentType: 'media',
        contentId: contentId
      },
      metadata: {
        contentType: contentData.type,
        thumbnailUrl: contentData.thumbnailUrl
      }
    };
    
    return this.createNotification(notification);
  }
}

module.exports = new NotificationService(); 
const UserInteraction = require('../models/userInteraction.model');
const UserProfile = require('../models/userProfile.model');
const Media = require('../models/media.model');
const Blog = require('../models/blog.model');
const { ApiError } = require('../features/error');
const httpStatus = require('http-status');
const logger = require('../features/logger');

class InteractionService {
    /**
     * Record a user interaction
     * @param {Object} interactionData - Interaction data
     * @returns {Promise<Object>}
     */
    async recordInteraction(interactionData) {
        try {
            const interaction = new UserInteraction(interactionData);
            await interaction.save();

            // Update relevant stats based on interaction type
            await this.updateStats(interaction);

            return interaction;
        } catch (error) {
            logger.error('Error recording interaction:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error recording interaction');
        }
    }

    /**
     * Update stats based on interaction type
     * @param {Object} interaction - Interaction object
     * @returns {Promise<void>}
     */
    async updateStats(interaction) {
        try {
            switch (interaction.type) {
            case 'follow':
                await UserProfile.updateOne(
                    { userId: interaction.targetId },
                    { $inc: { 'stats.followers': 1 } }
                );
                break;
            case 'unfollow':
                await UserProfile.updateOne(
                    { userId: interaction.targetId },
                    { $inc: { 'stats.followers': -1 } }
                );
                break;
            case 'like':
                if (interaction.targetType === 'media') {
                    await Media.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.likes': 1 } }
                    );
                } else if (interaction.targetType === 'blog') {
                    await Blog.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.likes': 1 } }
                    );
                }
                break;
            case 'unlike':
                if (interaction.targetType === 'media') {
                    await Media.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.likes': -1 } }
                    );
                } else if (interaction.targetType === 'blog') {
                    await Blog.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.likes': -1 } }
                    );
                }
                break;
            case 'comment':
                if (interaction.targetType === 'media') {
                    await Media.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.comments': 1 } }
                    );
                } else if (interaction.targetType === 'blog') {
                    await Blog.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.comments': 1 } }
                    );
                }
                break;
            case 'share':
                if (interaction.targetType === 'media') {
                    await Media.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.shares': 1 } }
                    );
                } else if (interaction.targetType === 'blog') {
                    await Blog.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.shares': 1 } }
                    );
                }
                break;
            case 'bookmark':
                if (interaction.targetType === 'media') {
                    await Media.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.bookmarks': 1 } }
                    );
                } else if (interaction.targetType === 'blog') {
                    await Blog.findByIdAndUpdate(
                        interaction.targetId,
                        { $inc: { 'engagement.bookmarks': 1 } }
                    );
                }
                break;
            }
        } catch (error) {
            logger.error('Error updating stats:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating stats');
        }
    }

    /**
     * Get user's unread interactions count
     * @param {string} userId - User ID
     * @returns {Promise<number>}
     */
    async getUnreadCount(userId) {
        try {
            return await UserInteraction.getUnreadCount(userId);
        } catch (error) {
            logger.error('Error getting unread count:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error getting unread count');
        }
    }

    /**
     * Get user's recent interactions
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getRecentInteractions(userId, options = {}) {
        try {
            return await UserInteraction.getRecentInteractions(userId, options);
        } catch (error) {
            logger.error('Error getting recent interactions:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error getting recent interactions');
        }
    }

    /**
     * Get interactions for a specific target
     * @param {string} targetId - Target ID
     * @param {string} targetType - Target type
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getInteractionsByTarget(targetId, targetType, options = {}) {
        try {
            return await UserInteraction.getInteractionsByTarget(targetId, targetType, options);
        } catch (error) {
            logger.error('Error getting target interactions:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error getting target interactions');
        }
    }

    /**
     * Mark interactions as read
     * @param {string} userId - User ID
     * @param {Array<string>} interactionIds - Interaction IDs to mark as read
     * @returns {Promise<void>}
     */
    async markAsRead(userId, interactionIds) {
        try {
            await UserInteraction.updateMany(
                {
                    _id: { $in: interactionIds },
                    userId
                },
                { $set: { isRead: true } }
            );
        } catch (error) {
            logger.error('Error marking interactions as read:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error marking interactions as read');
        }
    }

    /**
     * Archive interactions
     * @param {string} userId - User ID
     * @param {Array<string>} interactionIds - Interaction IDs to archive
     * @returns {Promise<void>}
     */
    async archiveInteractions(userId, interactionIds) {
        try {
            await UserInteraction.updateMany(
                {
                    _id: { $in: interactionIds },
                    userId
                },
                { $set: { isArchived: true } }
            );
        } catch (error) {
            logger.error('Error archiving interactions:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error archiving interactions');
        }
    }

    /**
     * Get user's activity feed
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>}
     */
    async getActivityFeed(userId, options = {}) {
        try {
            const { page = 1, limit = 20 } = options;
            const skip = (page - 1) * limit;

            const interactions = await UserInteraction.find({
                userId,
                isArchived: false
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username displayName avatar')
                .lean();

            const total = await UserInteraction.countDocuments({
                userId,
                isArchived: false
            });

            return {
                items: interactions,
                total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Error getting activity feed:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error getting activity feed');
        }
    }
}

module.exports = new InteractionService(); 
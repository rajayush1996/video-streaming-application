const CreatorRequest = require('../models/creatorRequest.model');
const MediaMeta = require('../models/mediaMeta.model');
const Blog = require('../models/blog.model');
const UserProfile = require('../models/userProfile.model');
const socketService = require('./socket.service');
const logger = require('../features/logger');

class AdminDashboardService {
    /**
     * Get counts of all pending items
     * @returns {Promise<Object>}
     */
    async getPendingItemsCount() {
        try {
            const [
                creatorRequests,
                mediaApprovals,
                blogApprovals,
                profileVerifications
            ] = await Promise.all([
                CreatorRequest.countDocuments({ status: 'pending' }),
                MediaMeta.countDocuments({ status: 'pending' }),
                Blog.countDocuments({ status: 'pending' }),
                UserProfile.countDocuments({ verificationStatus: 'pending' })
            ]);

            const counts = {
                creatorRequests,
                mediaApprovals,
                blogApprovals,
                profileVerifications
            };

            // Notify admins about pending items count
            socketService.notifyPendingItemsCount(counts);

            return counts;
        } catch (error) {
            logger.error('Error getting pending items count:', error);
            throw error;
        }
    }

    /**
     * Get recent activities across all modules
     * @param {number} limit - Number of activities to fetch
     * @returns {Promise<Array>}
     */
    async getRecentActivities(limit = 10) {
        try {
            const [
                recentCreatorRequests,
                recentMediaUploads,
                recentBlogs,
                recentProfileUpdates
            ] = await Promise.all([
                CreatorRequest.find()
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .populate('userId', 'username email'),
                MediaMeta.find()
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .populate('userId', 'username email'),
                Blog.find()
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .populate('userId', 'username email'),
                UserProfile.find()
                    .sort({ updatedAt: -1 })
                    .limit(limit)
                    .populate('userId', 'username email')
            ]);

            // Combine and sort all activities
            const activities = [
                ...recentCreatorRequests.map(req => ({
                    type: 'creator_request',
                    data: req,
                    timestamp: req.createdAt
                })),
                ...recentMediaUploads.map(media => ({
                    type: 'media_upload',
                    data: media,
                    timestamp: media.createdAt
                })),
                ...recentBlogs.map(blog => ({
                    type: 'blog',
                    data: blog,
                    timestamp: blog.createdAt
                })),
                ...recentProfileUpdates.map(profile => ({
                    type: 'profile_update',
                    data: profile,
                    timestamp: profile.updatedAt
                }))
            ].sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, limit);

            return activities;
        } catch (error) {
            logger.error('Error getting recent activities:', error);
            throw error;
        }
    }
}

module.exports = new AdminDashboardService(); 
const MediaMeta = require('../models/mediaMeta.model');
const Blog = require('../models/blog.model');
const UserCredentials = require('../models/userCredentials.model');
const File = require('../models/file.model');
const logger = require('../features/logger');
const { ApiError } = require('../features/error');
const httpStatus = require('http-status');

class DashboardService {
    /**
     * Get overview metrics (total videos, blogs, views, users)
     * @returns {Promise<Object>} Overview metrics
     */
    async getOverviewMetrics() {
        try {
            // Use Promise.all to run all queries in parallel
            const [videosCount, blogsCount, usersCount] = await Promise.all([
                MediaMeta.countDocuments({ isDeleted: false }),
                Blog.countDocuments({ deletedAt: null }),
                UserCredentials.countDocuments({ status: 'active' })
            ]);

            // Get total views using the new views field
            const viewsAggregate = await MediaMeta.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: null, totalViews: { $sum: '$views' } } }
            ]);
            
            const totalViews = viewsAggregate.length > 0 ? viewsAggregate[0].totalViews : 0;

            return {
                videosCount,
                blogsCount,
                totalViews,
                usersCount
            };
        } catch (error) {
            logger.error('Error getting overview metrics:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching dashboard metrics');
        }
    }

    /**
     * Get recent activities
     * @param {number} limit - Number of activities to fetch
     * @returns {Promise<Array>} Recent activities
     */
    async getRecentActivities(limit = 10) {
        try {
            // Get recent videos
            const recentVideos = await MediaMeta.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
            
            // Get recent blogs
            const recentBlogs = await Blog.find({ deletedAt: null })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('admin', 'username email')
                .lean();
            
            
            // Get all unique user IDs from videos
            const userIds = recentVideos
                .filter(video => video.userId)
                .map(video => video.userId);
            
            // Fetch all users in one query using string IDs
            const users = userIds.length > 0 
                ? await UserCredentials.find({ _id: { $in: userIds } })
                    .select('username email')
                    .lean()
                : [];
            
            // Create a map for quick user lookup using string IDs
            const userMap = {};
            users.forEach(user => {
                userMap[user._id] = user;
            });
            
            // Combine and format activities
            const combinedActivities = [
                ...recentVideos.map(video => {
                    // Look up user from the map using string ID
                    const user = video.userId ? userMap[video.userId] : null;
                    
                    return {
                        time: video.createdAt,
                        action: 'uploaded',
                        resourceType: 'video',
                        resourceId: video._id,
                        resourceName: video.title || 'Untitled Video',
                        user: user 
                            ? user.username || user.email
                            : 'Unknown'
                    };
                }),
                ...recentBlogs.map(blog => ({
                    time: blog.createdAt,
                    action: blog.publishedAt ? 'published' : 'drafted',
                    resourceType: 'blog',
                    resourceId: blog._id,
                    resourceName: blog.title || 'Untitled Blog',
                    user: blog.admin ? 
                        blog.admin.username || blog.admin.email : 
                        'Unknown'
                }))
            ];
            
            // Sort by time (most recent first)
            combinedActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
            
            // Return only the requested number of activities
            return combinedActivities.slice(0, limit);
        } catch (error) {
            logger.error('Error getting recent activities:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching recent activities');
        }
    }

    /**
     * Get system status (storage usage, moderation queue)
     * @returns {Promise<Object>} System status
     */
    async getSystemStatus() {
        try {
            // Calculate storage used
            const storageAggregate = await File.aggregate([
                { $group: { _id: null, totalSize: { $sum: { $ifNull: ['$size', 0] } } } }
            ]);
            
            const storageUsed = storageAggregate.length > 0 ? storageAggregate[0].totalSize : 0;
            
            // For this example, let's assume:
            // - Videos with null or empty status need moderation
            // - Blogs with status='draft' need review
            const [pendingVideos, pendingBlogs] = await Promise.all([
                MediaMeta.countDocuments({ isDeleted: false, status: { $in: [null, '', 'pending'] } }),
                Blog.countDocuments({ deletedAt: null, status: 'draft' })
            ]);
            
            // For storage capacity, this would typically come from a config or settings table
            // For this example, we'll hardcode a value (500GB in bytes)
            const storageCapacity = 500 * 1024 * 1024 * 1024; // 500GB in bytes
            
            return {
                storage: {
                    used: storageUsed,
                    capacity: storageCapacity,
                    usedPercentage: (storageUsed / storageCapacity) * 100
                },
                moderation: {
                    pendingVideos,
                    pendingBlogs,
                    totalPending: pendingVideos + pendingBlogs
                }
            };
        } catch (error) {
            logger.error('Error getting system status:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching system status');
        }
    }
}

module.exports = new DashboardService(); 
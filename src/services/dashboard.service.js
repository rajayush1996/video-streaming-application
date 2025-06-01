const httpStatus = require('http-status');
const { ApiError } = require('../features/error');
const logger = require('../features/logger');
const MediaMeta = require('../models/mediaMeta.model');
const Blog = require('../models/blog.model');
const UserCredentials = require('../models/userCredentials.model');
const File = require('../models/file.model');
const Video = require('../models/video.model');
const Reel = require('../models/reel.model');

class DashboardService {
    /**
     * Get overview metrics (total videos, blogs, views, users)
     * @returns {Promise<Object>} Overview metrics
     */
    async getOverviewMetrics() {
        try {
            // Use Promise.all to run all queries in parallel
            const [videosCount, blogsCount, usersCount, reelsCount] = await Promise.all([
                Video.countDocuments({ isDeleted: false }),
                Blog.countDocuments({ isDeleted: false }),
                UserCredentials.countDocuments({ status: 'active' }),
                Reel.countDocuments({ isDeleted: false })
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
                reelsCount,
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
            const recentVideos = await Video.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('userId', 'username email')
                .lean();
            
            // Get recent blogs
            const recentBlogs = await Blog.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('userId', 'username email')
                .lean();

            // Get recent reels
            const recentReels = await Reel.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('userId', 'username email')
                .lean();
            
            // Format video activities
            const videoActivities = recentVideos.map(video => ({
                time: video.createdAt,
                action: 'upload',
                resourceType: 'video',
                resourceId: video._id,
                resourceName: video.title,
                user: video.userId ? 
                    (video.userId.username || video.userId.email) : 
                    'Unknown User',
                details: {
                    status: video.status,
                    type: video.type
                }
            }));

            // Format blog activities
            const blogActivities = recentBlogs.map(blog => ({
                time: blog.createdAt,
                action: 'create',
                resourceType: 'blog',
                resourceId: blog._id,
                resourceName: blog.title,
                user: blog.userId ? 
                    (blog.userId.username || blog.userId.email) : 
                    'Unknown User',
                details: {
                    status: blog.status
                }
            }));

            // Format reel activities
            const reelActivities = recentReels.map(reel => ({
                time: reel.createdAt,
                action: 'upload',
                resourceType: 'reel',
                resourceId: reel._id,
                resourceName: reel.title,
                user: reel.userId ? 
                    (reel.userId.username || reel.userId.email) : 
                    'Unknown User',
                details: {
                    status: reel.status,
                    type: reel.type
                }
            }));

            // Combine and sort all activities
            const allActivities = [...videoActivities, ...blogActivities, ...reelActivities]
                .sort((a, b) => b.time - a.time)
                .slice(0, limit);

            return allActivities;
        } catch (error) {
            logger.error('Error in getRecentActivities:', error);
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
            
            // Get pending content counts
            const [pendingVideos, pendingBlogs, pendingReels] = await Promise.all([
                Video.countDocuments({ isDeleted: false, status: { $in: [null, '', 'pending'] } }),
                Blog.countDocuments({ isDeleted: false, status: 'draft' }),
                Reel.countDocuments({ isDeleted: false, status: { $in: [null, '', 'pending'] } })
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
                    pendingReels,
                    totalPending: pendingVideos + pendingBlogs + pendingReels
                }
            };
        } catch (error) {
            logger.error('Error getting system status:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching system status');
        }
    }

    /**
     * Helper method to get resource name from audit log
     * @param {Object} log - Audit log object
     * @returns {string} Resource name
     */
    getResourceNameFromAuditLog(log) {
        if (!log.details) return 'Unknown Resource';

        const resource = log.details.after || log.details.before;
        if (!resource) return 'Unknown Resource';

        switch (log.resourceType) {
        case 'USER':
            return resource.username || resource.email || 'User';
        case 'BLOG':
            return resource.title || 'Untitled Blog';
        case 'MEDIA_METADATA':
            return resource.title || 'Untitled Media';
        case 'CATEGORY':
            return resource.name || 'Unnamed Category';
        case 'NOTIFICATION':
            return resource.title || 'Notification';
        case 'PINNED_POST':
            return 'Pinned Post';
        case 'USER_PROFILE':
            return resource.displayName || 'User Profile';
        default:
            return 'Unknown Resource';
        }
    }
}

module.exports = new DashboardService(); 
const httpStatus = require("http-status");
const { ApiError } = require("../features/error");
const logger = require("../features/logger");
const VideoMetadata = require("../models/videoMetaData");
const Blog = require("../models/blog.model");
const UserCredentials = require("../models/userCredentials.model");
const File = require("../models/file.model");

class DashboardService {
    /**
   * Get overview metrics (total videos, blogs, views, users)
   * @returns {Promise<Object>} Overview metrics
   */
    async getOverviewMetrics() {
        try {
            // Use Promise.all to run all queries in parallel
            //  videoViewsAgg, reelViewsAgg

            const [
                approvedVideos,
                approvedReels,
                blogsCount,
                usersCount,
                unapprovedVideos,
                unapprovedReels,
            ] = await Promise.all([
                VideoMetadata.countDocuments({
                    isDeleted: false,
                    mediaType: "video",
                    approvedStatus: "approved",
                }),
                VideoMetadata.countDocuments({
                    isDeleted: false,
                    mediaType: "reel",
                    approvedStatus: "approved",
                }),
                Blog.countDocuments({ isDeleted: false }),
                UserCredentials.countDocuments({ status: "active" }),
                VideoMetadata.countDocuments({
                    isDeleted: false,
                    mediaType: "video",
                    approvedStatus: { $ne: "approved" },
                }),
                VideoMetadata.countDocuments({
                    isDeleted: false,
                    mediaType: "reel",
                    approvedStatus: { $ne: "approved" },
                }),
                // Video.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: null, totalViews: { $sum: "$views" } } }]),
                // Reel.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: null, totalViews: { $sum: "$views" } } }])
            ]);

            // Get total views using the new views field
            const viewsAggregate = await VideoMetadata.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: null, totalViews: { $sum: "$views" } } },
            ]);

            const totalViews =
        viewsAggregate.length > 0 ? viewsAggregate[0].totalViews : 0;

            return {
                approvedVideos,
                approvedReels,
                unapprovedVideos,
                unapprovedReels,
                blogsCount,
                totalViews,
                usersCount,
            };
        } catch (error) {
            logger.error("Error getting overview metrics:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching dashboard metrics"
            );
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
            const recentMedia = await VideoMetadata.aggregate([
                { $match: { isDeleted: false } },
                { $sort: { createdAt: -1 } },
                { $limit: limit },

                {
                    $lookup: {
                        from: "usercredentials",
                        let: { userId: "$parentId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                            { $project: { _id: 1, username: 1, email: 1 } },
                        ],
                        as: "userCred",
                    },
                },

                {
                    $lookup: {
                        from: "userprofiles",
                        let: { userIdStr: "$parentId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$userId", "$$userIdStr"] } } },
                            { $project: { _id: 1, displayName: 1 } },
                        ],
                        as: "userProfile",
                    },
                },

                {
                    $addFields: {
                        userCred: { $arrayElemAt: ["$userCred", 0] },
                        userProfile: { $arrayElemAt: ["$userProfile", 0] },
                    },
                },
            ]);

            // Get recent blogs
            const recentBlogs = await Blog.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();

            // Format video activities
            const mediaActivities = recentMedia.map((media) => ({
                time: media.createdAt,
                action: "uploaded",
                resourceType: media.mediaType,
                resourceId: media._id,
                resourceName: media.title,
                user: media.parentId
                    ? media?.userCred?.username ||
            media?.userCred?.email ||
            media?.userProfile?.displayName
                    : "Unknown User",
                details: {
                    status: media.approvedStatus,
                    type: media.mediaType,
                },
            }));

            // Format blog activities
            const blogActivities = recentBlogs.map((blog) => ({
                time: blog.createdAt,
                action: "create",
                resourceType: "blog",
                resourceId: blog._id,
                resourceName: blog.title,
                user: blog.userId
                    ? blog.userId.username || blog.userId.email
                    : "Unknown User",
                details: {
                    status: blog.status,
                },
            }));

            // Combine and sort all activities
            const allActivities = [...mediaActivities, ...blogActivities]
                .sort((a, b) => b.time - a.time)
                .slice(0, limit);

            return allActivities;
        } catch (error) {
            logger.error("Error in getRecentActivities:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching recent activities"
            );
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
                {
                    $group: { _id: null, totalSize: { $sum: { $ifNull: ["$size", 0] } } },
                },
            ]);

            const storageUsed =
        storageAggregate.length > 0 ? storageAggregate[0].totalSize : 0;

            // Get pending content counts
            const [pendingVideos, pendingReels, pendingBlogs] = await Promise.all([
                VideoMetadata.countDocuments({
                    isDeleted: false,
                    mediaType: "video",
                    approvedStatus: "pending",
                }),
                VideoMetadata.countDocuments({
                    isDeleted: false,
                    mediaType: "reel",
                    approvedStatus: "pending",
                }),
                Blog.countDocuments({ isDeleted: false, status: "draft" }),
            ]);

            // For storage capacity, this would typically come from a config or settings table
            // For this example, we'll hardcode a value (500GB in bytes)
            const storageCapacity = 500 * 1024 * 1024 * 1024; // 500GB in bytes

            return {
                storage: {
                    used: storageUsed,
                    capacity: storageCapacity,
                    usedPercentage: (storageUsed / storageCapacity) * 100,
                },
                moderation: {
                    pendingVideos,
                    totalPending: pendingVideos + pendingReels + pendingBlogs,
                    pendingReels,
                },
            };
        } catch (error) {
            logger.error("Error getting system status:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching system status"
            );
        }
    }

    /**
   * Get moderation statistics grouped by media type and status
   * @returns {Promise<Object>} Moderation stats
   */
    async getModerationStats() {
        try {
            const aggregation = await VideoMetadata.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: { mediaType: "$mediaType", approvedStatus: "$approvedStatus" },
                        count: { $sum: 1 },
                    },
                },
            ]);

            const stats = {
                video: { approved: 0, pending: 0, rejected: 0, views: 0 },
                reel: { approved: 0, pending: 0, rejected: 0, views: 0 },
            };

            aggregation.forEach((a) => {
                const type = a._id.mediaType;
                const status = a._id.approvedStatus;
                if (stats[type]) {
                    stats[type][status] = a.count;
                }
            });

            const viewAgg = await VideoMetadata.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: "$mediaType", views: { $sum: "$views" } } },
            ]);

            viewAgg.forEach((v) => {
                if (stats[v._id]) {
                    stats[v._id].views = v.views;
                }
            });

            return stats;
        } catch (error) {
            logger.error("Error getting moderation stats:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching moderation stats"
            );
        }
    }

    /**
   * Get moderation statistics grouped by media type and status
   * @returns {Promise<Object>} Moderation stats
   */
    async getModeration(status) {
        try {
            // const result = await VideoMetadata.find({ approvedStatus: status, isDeleted: false });
            const result = await VideoMetadata.aggregate([
                { $match: { isDeleted: false, approvedStatus: status } },
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: "usercredentials",
                        let: { userId: "$parentId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                            { $project: { _id: 1, username: 1, email: 1 } },
                        ],
                        as: "userCred",
                    },
                },

                {
                    $lookup: {
                        from: "userprofiles",
                        let: { userIdStr: "$parentId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$userId", "$$userIdStr"] } } },
                            { $project: { _id: 1, displayName: 1 } },
                        ],
                        as: "userProfile",
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        let: { categoryId: "$category" },
                        pipeline: [
                            { $match: { $expr: { $eq: [ "$_id", "$$categoryId"] } } },
                            { $project: { _id: 1, name: 1, type: 1 } }
                        ],
                        as: "category",
                    }
                },
                {
                    $addFields: {
                        userCred: { $arrayElemAt: ["$userCred", 0] },
                        userProfile: { $arrayElemAt: ["$userProfile", 0] },
                        category: { $arrayElemAt: ["$category", 0] },
                    },
                },
            ]);
            return result;
        } catch (error) {
            logger.error("Error getting moderation stats:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error fetching moderation stats"
            );
        }
    }

    /**
   * Helper method to get resource name from audit log
   * @param {Object} log - Audit log object
   * @returns {string} Resource name
   */
    getResourceNameFromAuditLog(log) {
        if (!log.details) return "Unknown Resource";

        const resource = log.details.after || log.details.before;
        if (!resource) return "Unknown Resource";

        switch (log.resourceType) {
        case "USER":
            return resource.username || resource.email || "User";
        case "BLOG":
            return resource.title || "Untitled Blog";
        case "MEDIA_METADATA":
            return resource.title || "Untitled Media";
        case "CATEGORY":
            return resource.name || "Unnamed Category";
        case "NOTIFICATION":
            return resource.title || "Notification";
        case "PINNED_POST":
            return "Pinned Post";
        case "USER_PROFILE":
            return resource.displayName || "User Profile";
        default:
            return "Unknown Resource";
        }
    }

    async updateModerationStatus(id, { approvedStatus, rejectedReason }) {
        try {
            const update = { approvedStatus };
            if (approvedStatus === 'rejected') {
                update.rejectedReason = rejectedReason;
            } else {
                update.rejectedReason = undefined;
            }

            const result = await VideoMetadata.findByIdAndUpdate(
                id,
                update,
                { new: true, runValidators: true }
            );

            if (!result) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Video metadata not found');
            }
            return result;
        } catch (error) {
            logger.error('Error updating moderation status:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error updating moderation status'
            );
        }
    }
}

module.exports = new DashboardService();

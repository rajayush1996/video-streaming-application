const httpStatus = require('http-status');
const { ApiError } = require('../features/error');
const Blog = require('../models/blog.model');
const Video = require('../models/video.model');
const Reel = require('../models/reel.model');
const MediaMeta = require('../models/mediaMeta.model');
const logger = require('../features/logger');
const UserCredential = require('../models/userCredentials.model');
const Category = require('../models/category.model');

/**
 * Get home feed with mixed content
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} [options.category] - Category filter
 * @param {boolean} [options.featured] - Featured content filter
 * @returns {Promise<Object>} Home feed data
 */
exports.getHomeFeed = async (options) => {
    try {
        const { page = 1, limit = 10, category, featured } = options;
        const skip = (page - 1) * limit;

        // Build query
        const query = { status: 'published' };
        if (category) query.category = category;
        if (featured) query.isFeatured = true;

        // First, fetch all content with basic info
        const [featuredBlogs, featuredVideos, featuredReels] = await Promise.all([
            Blog.find({ ...query })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean(),
            Video.find({ ...query })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean(),
            Reel.find({ ...query })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean()
        ]);
        console.log("🚀 ~ exports.getHomeFeed= ~ featuredReels:", featuredReels)
        console.log("🚀 ~ exports.getHomeFeed= ~ featuredVideos:", featuredVideos)
        console.log("🚀 ~ exports.getHomeFeed= ~ featuredBlogs:", featuredBlogs)

        const [trendingBlogs, trendingVideos, trendingReels] = await Promise.all([
            Blog.find({ ...query, isTrending: true })
                .sort({ viewCount: -1 })
                .limit(5)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean(),
            Video.find({ ...query, isTrending: true })
                .sort({ viewCount: -1 })
                .limit(5)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean(),
            Reel.find({ ...query, isTrending: true })
                .sort({ viewCount: -1 })
                .limit(5)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean()
        ]);

        const [latestBlogs, latestVideos, latestReels] = await Promise.all([
            Blog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean(),
            Video.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean(),
            Reel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
                .lean()
        ]);

        // Collect all MediaMeta IDs
        const mediaMetaIds = new Set();
        [...featuredBlogs, ...featuredVideos, ...featuredReels,
            ...trendingBlogs, ...trendingVideos, ...trendingReels,
            ...latestBlogs, ...latestVideos, ...latestReels].forEach(item => {
            if (item.thumbnailMetadata) mediaMetaIds.add(item.thumbnailMetadata);
            if (item.contentMetadata) mediaMetaIds.add(item.contentMetadata);
        });

        // Fetch all MediaMeta documents in one query
        const mediaMetaMap = new Map();
        const mediaMetaDocs = await MediaMeta.find({ _id: { $in: Array.from(mediaMetaIds) } })
            .select('_id url type metadata')
            .lean();
        mediaMetaDocs.forEach(doc => mediaMetaMap.set(doc._id.toString(), doc));

        // Collect all user IDs
        const userIds = new Set();
        [...featuredBlogs, ...featuredVideos, ...featuredReels,
            ...trendingBlogs, ...trendingVideos, ...trendingReels,
            ...latestBlogs, ...latestVideos, ...latestReels].forEach(item => {
            if (item.user) userIds.add(item.user);
        });

        // Fetch all user documents in one query
        const userMap = new Map();
        const userDocs = await UserCredential.find({ _id: { $in: Array.from(userIds) } })
            .select('_id username profilePicture displayName bio')
            .lean();
        userDocs.forEach(doc => userMap.set(doc._id.toString(), doc));

        // Collect all category IDs
        const categoryIds = new Set();
        [...featuredBlogs, ...featuredVideos, ...featuredReels,
            ...trendingBlogs, ...trendingVideos, ...trendingReels,
            ...latestBlogs, ...latestVideos, ...latestReels].forEach(item => {
            if (item.category) categoryIds.add(item.category);
        });

        // Fetch all category documents in one query
        const categoryMap = new Map();
        const categoryDocs = await Category.find({ _id: { $in: Array.from(categoryIds) } })
            .select('_id name description')
            .lean();
        categoryDocs.forEach(doc => categoryMap.set(doc._id.toString(), doc));

        // Format content with populated data
        const formatContent = (items) => {
            return items.map(item => ({
                id: item._id,
                title: item.title,
                description: item.description,
                status: item.status,
                isFeatured: item.isFeatured,
                isTrending: item.isTrending,
                viewCount: item.viewCount,
                likeCount: item.likeCount,
                commentCount: item.commentCount,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                user: item.user ? userMap.get(item.user.toString()) : null,
                category: item.category ? categoryMap.get(item.category.toString()) : null,
                thumbnail: item.thumbnailMetadata ? mediaMetaMap.get(item.thumbnailMetadata.toString()) : null,
                content: item.contentMetadata ? mediaMetaMap.get(item.contentMetadata.toString()) : null
            }));
        };

        // Get total counts
        const [totalBlogs, totalVideos, totalReels] = await Promise.all([
            Blog.countDocuments(query),
            Video.countDocuments(query),
            Reel.countDocuments(query)
        ]);

        return {
            featured: {
                blogs: formatContent(featuredBlogs),
                videos: formatContent(featuredVideos),
                reels: formatContent(featuredReels)
            },
            trending: {
                blogs: formatContent(trendingBlogs),
                videos: formatContent(trendingVideos),
                reels: formatContent(trendingReels)
            },
            latest: {
                blogs: formatContent(latestBlogs),
                videos: formatContent(latestVideos),
                reels: formatContent(latestReels)
            },
            pagination: {
                page,
                limit,
                total: totalBlogs + totalVideos + totalReels,
                pages: Math.ceil((totalBlogs + totalVideos + totalReels) / limit)
            }
        };
    } catch (error) {
        logger.error('Error in getHomeFeed:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching home feed');
    }
}; 
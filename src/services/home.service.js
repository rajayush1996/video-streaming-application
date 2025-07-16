const httpStatus = require("http-status");
const { ApiError } = require("../features/error");
const Blog = require("../models/blog.model");
const Video = require("../models/video.model");
const Reel = require("../models/reel.model");
const MediaMeta = require("../models/mediaMeta.model");
const logger = require("../features/logger");
const UserCredential = require("../models/userCredentials.model");
const Category = require("../models/category.model");
const fileModel = require("../models/file.model");

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
        const {
            category,
            topVideos,
            trendingReels,
            trendingBlogs,
            all,
            latestVideos,
        } = options;

        let topVideosResultP = [],
            trendingReelsResultP = [],
            trendingBlogsResultP = [],
            latestVideosResultP = [];
        let totalTopVideosP = 0,
            totalTrendingReelsP = 0,
            totalTrendingBlogsP = 0,
            totalLatestVideosP = 0;
        let categoryInfo = category || null;
        if (categoryInfo === "all") {
            categoryInfo = undefined;
        }
        let topSkip, trendingReelsSkip, trendingBlogsSkip, latestVideosSkip;
        // if (topVideos || all) {
        //     topSkip = ((topVideos?.page || 1) - 1) * (topVideos?.limit || 10);
        //     const sortBy = topVideos?.sortBy || "createdAt";
        //     const sortOrder = topVideos?.sortOrder === "asc" ? 1 : -1;
        //     const sortQuery = {};
        //     sortQuery[sortBy] = sortOrder;
        //     const query = { status: "published", category: categoryInfo };
        //     topVideosResultP = Video.find({ ...query })
        //         .sort(sortQuery)
        //         .skip(topSkip)
        //         .limit(topVideos?.limit || 10)
        //         .lean();
        //     totalTopVideosP = Video.countDocuments({ ...query });
        // }
        if (latestVideos || all) {
            latestVideosSkip =
        ((latestVideos?.page || 1) - 1) * (latestVideos?.limit || 10);
            const sortBy = latestVideos?.sortBy || "createdAt";
            const sortOrder = latestVideos?.sortOrder === "asc" ? 1 : -1;
            const sortQuery = {};
            sortQuery[sortBy] = sortOrder;
            const query = { status: "published", category: categoryInfo };
            // Using $sample for random selection
            // latestVideosResultP = Video.aggregate([{ $match: query }, { $sample: { size:  (latestVideos?.limit || 10) } }])

            latestVideosResultP = Video.find({ ...query })
                .sort(sortQuery)
                .skip(latestVideosSkip)
                .limit(latestVideos?.limit || 10)
                .lean();
            totalLatestVideosP = Video.countDocuments({ ...query });
        }
        if (trendingReels || all) {
            trendingReelsSkip =
        ((trendingReels?.page || 1) - 1) * (trendingReels?.limit || 10);
            const sortBy = trendingReels?.sortBy || "createdAt";
            const sortOrder = trendingReels?.sortOrder === "asc" ? 1 : -1;
            const sortQuery = {};
            sortQuery[sortBy] = sortOrder;
            const query = { status: "published" };
            trendingReelsResultP = Reel.find({ ...query })
                .sort(sortQuery)
                .skip(trendingReelsSkip)
                .limit(trendingReels?.limit || 10)
                .lean();
            totalTrendingReelsP = Reel.countDocuments({ ...query });
        }
        if (trendingBlogs || all) {
            trendingBlogsSkip =
        ((trendingBlogs?.page || 1) - 1) * (trendingBlogs?.limit || 10);
            const sortBy = trendingBlogs?.sortBy || "createdAt";
            const sortOrder = trendingBlogs?.sortOrder === "asc" ? 1 : -1;
            const sortQuery = {};
            sortQuery[sortBy] = sortOrder;
            const query = { status: "published" };
            trendingBlogsResultP = Blog.find({ ...query })
                .sort(sortQuery)
                .skip(trendingBlogsSkip)
                .limit(trendingBlogs?.limit || 10)
                .lean();
            totalTrendingBlogsP = Blog.countDocuments({ ...query });
        }

        // Build query

        const [
            topVideosResult,
            latestVideosResult,
            trendingReelsResult,
            trendingBlogsResult,
            totalTopVideos,
            totalLatestVideos,
            totalTrendingReels,
            totalTrendingBlogs,
        ] = await Promise.all([
            topVideosResultP,
            latestVideosResultP,
            trendingReelsResultP,
            trendingBlogsResultP,
            totalTopVideosP,
            totalLatestVideosP,
            totalTrendingReelsP,
            totalTrendingBlogsP,
        ]);

        // const [trendingBlogs, trendingVideos, trendingReels] = await Promise.all([
        //     Blog.find({ ...query, isTrending: true })
        //         .sort({ viewCount: -1 })
        //         .limit(5)
        //         .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
        //         .lean(),
        //     Video.find({ ...query, isTrending: true })
        //         .sort({ viewCount: -1 })
        //         .limit(5)
        //         .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
        //         .lean(),
        //     Reel.find({ ...query, isTrending: true })
        //         .sort({ viewCount: -1 })
        //         .limit(5)
        //         .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
        //         .lean()
        // ]);

        // const [latestBlogs, latestVideos, latestReels] = await Promise.all([
        //     Blog.find(query)
        //         .sort({ createdAt: -1 })
        //         .skip(skip)
        //         .limit(limit)
        //         .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
        //         .lean(),
        //     Video.find(query)
        //         .sort({ createdAt: -1 })
        //         .skip(skip)
        //         .limit(limit)
        //         .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
        //         .lean(),
        //     Reel.find(query)
        //         .sort({ createdAt: -1 })
        //         .skip(skip)
        //         .limit(limit)
        //         .select('_id title description status isFeatured isTrending viewCount likeCount commentCount createdAt updatedAt user category thumbnailMetadata contentMetadata')
        //         .lean()
        // ]);

        // Collect all MediaMeta IDs
        const mediaMetaIds = new Set();
        topVideosResult.forEach((item) => {
            mediaMetaIds.add(item?.videoSpecific?.mediaMetaId);
        });

        latestVideosResult.forEach((item) => {
            mediaMetaIds.add(item?.videoSpecific?.mediaMetaId);
        });

        trendingReelsResult.forEach((item) => {
            mediaMetaIds.add(item?.reelSpecific?.mediaMetaId);
        });

        trendingBlogsResult.forEach((item) => {
            mediaMetaIds.add(item?.blogSpecific?.mediaMetaId);
        });

        // Fetch all MediaMeta documents in one query
        const mediaMetaMap = new Map();
        const mediaMetaDocs = await MediaMeta.find({
            _id: { $in: Array.from(mediaMetaIds) },
        }).lean();
        mediaMetaDocs.forEach((doc) => mediaMetaMap.set(doc.mediaFileId, doc));
        mediaMetaDocs.forEach((doc) => mediaMetaMap.set(doc.thumbnailId, doc));
        const mediaFileIds = mediaMetaDocs.map((doc) => doc.mediaFileId);
        const thumbnailIds = mediaMetaDocs.map((doc) => doc?.thumbnailId || null);

        const fileDetails = await fileModel
            .find({ fileId: { $in: [...mediaFileIds, ...thumbnailIds] } })
            .lean();

        // Map file details to mediaMetaMap
        const urlDetailsWithmediaMetaMap = new Map();
        fileDetails.forEach((eachFile) => {
            const mediaDocs = mediaMetaMap.get(eachFile.fileId);
            if (urlDetailsWithmediaMetaMap.has(mediaDocs._id)) {
                const existingMediaMeta = urlDetailsWithmediaMetaMap.get(mediaDocs._id);
                if (eachFile.containerName === "thumbnails") {
                    const updatedExistingMedia = {
                        ...existingMediaMeta,
                        thumbnailDetails: {
                            fileId: eachFile.fileId,
                            fileName: eachFile.originalName,
                            length: eachFile.size,
                            visibility: eachFile.visibility,
                            url: eachFile.url,
                            id: eachFile._id,
                        },
                    };
                    urlDetailsWithmediaMetaMap.set(mediaDocs._id, updatedExistingMedia);
                } else {
                    const updatedExistingMedia = {
                        ...existingMediaMeta,
                        mediaDetails: {
                            fileId: eachFile.fileId,
                            fileName: eachFile.originalName,
                            length: eachFile.size,
                            visibility: eachFile.visibility,
                            url: eachFile.url,
                            id: eachFile._id,
                        },
                    };
                    urlDetailsWithmediaMetaMap.set(mediaDocs._id, updatedExistingMedia);
                }
            } else {
                const newExistingMediaPayload = {
                    ...mediaDocs,
                };
                const urlDetails = {
                    fileId: eachFile.fileId,
                    fileName: eachFile.originalName,
                    length: eachFile.size,
                    visibility: eachFile.visibility,
                    url: eachFile.url,
                    id: eachFile._id,
                };
                if (
                    eachFile.containerName === "thumbnails" ||
          eachFile.containerName === "thumbnail"
                ) {
                    newExistingMediaPayload.thumbnailDetails = urlDetails;
                } else {
                    newExistingMediaPayload.mediaDetails = urlDetails;
                }
                urlDetailsWithmediaMetaMap.set(mediaDocs._id, newExistingMediaPayload);
            }
        });

        const urlDetailsWithmediaMeta = [];

        // Collect all user IDs
        const userIds = new Set();
        [
            ...trendingBlogsResult,
            ...latestVideosResult,
            ...topVideosResult,
            ...trendingReelsResult,
        ].forEach((item) => {
            if (item.user) userIds.add(item.user);
            const payload = {
                ...item,
                ...urlDetailsWithmediaMetaMap.get(
                    item?.videoSpecific?.mediaMetaId || item?.reelSpecific?.mediaMetaId
                ),
                id: item._id,
            };
            delete payload._id;
            delete payload.__v;
            urlDetailsWithmediaMeta.push(payload);
        });

        // Fetch all user documents in one query
        const userMap = new Map();
        const userDocs = await UserCredential.find({
            _id: { $in: Array.from(userIds) },
        })
            .select("_id username profilePicture displayName bio")
            .lean();
        userDocs.forEach((doc) => userMap.set(doc._id.toString(), doc));

        // Collect all category IDs
        const categoryIds = new Set();
        [
            ...trendingBlogsResult,
            ...topVideosResult,
            ...trendingReelsResult,
        ].forEach((item) => {
            if (item.category) categoryIds.add(item.category);
        });

        // Fetch all category documents in one query
        const categoryMap = new Map();
        const categoryDocs = await Category.find({
            _id: { $in: Array.from(categoryIds) },
        })
            .select("_id name description")
            .lean();
        categoryDocs.forEach((doc) => categoryMap.set(doc._id.toString(), doc));

        const newUpdatedReels = [];
        const newUpdatedVideos = [];
        urlDetailsWithmediaMeta.forEach((eachData) => {
            if (eachData.type === "reel") {
                newUpdatedReels.push(eachData);
            } else {
                newUpdatedVideos.push(eachData);
            }
        });
        const uniqueUpdatedVideos = [];
        const seenIds = new Set();

        for (const video of newUpdatedVideos) {
            if (!seenIds.has(video.id)) {
                seenIds.add(video.id);
                uniqueUpdatedVideos.push(video);
            }
        }


        // Format content with populated data
        const formatContent = (items) => {
            return items.map((item) => ({
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
                category: item.category
                    ? categoryMap.get(item.category.toString())
                    : null,
                thumbnail: item.thumbnailMetadata
                    ? mediaMetaMap.get(item.thumbnailMetadata.toString())
                    : null,
                content: item.contentMetadata
                    ? mediaMetaMap.get(item.contentMetadata.toString())
                    : null,
            }));
        };

        // Get total counts
        // const [totalBlogs, totalVideos, totalReels] = await Promise.all([
        //     Blog.countDocuments(query),
        //     Video.countDocuments(query),
        //     Reel.countDocuments(query)
        // ]);

        return {
            featuredVideos: {
                results: uniqueUpdatedVideos,
                total: totalLatestVideos,
                hasMore: totalTopVideos > topSkip + (topVideos?.limit || 10),
                limit: topVideos?.limit || 10,
                totalPages: Math.ceil(totalTopVideos / (topVideos?.limit || 10)),
                page: topVideos?.page || 1,
            },
            trendingReels: {
                results: newUpdatedReels,
                totalResults: totalTrendingReels,
                hasMore: totalTrendingReels > trendingReelsSkip + (trendingReels?.limit || 10),
                limit: trendingReels?.limit || 10,
                totalPages: Math.ceil(
                    totalTrendingReels / (trendingReels?.limit || 10)
                ),
                page: trendingReels?.page || 1,
            },
            latestVideos: {
                results: uniqueUpdatedVideos,
                totalResults: totalLatestVideos,
                hasMore:
          totalLatestVideos > latestVideosSkip + (latestVideos?.limit || 10),
                limit: latestVideos?.limit || 10,
                totalPages: Math.ceil(totalLatestVideos / (latestVideos?.limit || 10)),
                page: latestVideos?.page || 1,
            },
            trendingBlogs: {
                results: formatContent(trendingBlogsResult),
                totalResults: totalTrendingBlogs,
                hasMore:
          totalTrendingBlogs > trendingBlogsSkip + (trendingBlogs?.limit || 10),
                limit: trendingBlogs?.limit || 10,
                totalPages: Math.ceil(
                    totalTrendingBlogs / (trendingBlogs?.limit || 10)
                ),
                page: trendingBlogs?.page || 1,
            },
        };
    } catch (error) {
        logger.error("Error in getHomeFeed:", error);
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Error fetching home feed"
        );
    }
};


exports.getTrendingVideos = async ({ page = 1, limit = 10, category }) => {
    try {
        const query = { status: "published" };
        if (category && category !== "all") {
            query.category = category;
        }

        // Fetch trending videos
        const videos = await Video.paginate(query, {
            sort: { createdAt: -1 },
            lean: true,
            page,
            limit
        });


        // Collect mediaMeta IDs
        const mediaMetaIds = videos.results.map(v => v?.videoSpecific?.mediaMetaId).filter(Boolean);
        const mediaMetaDocs = await MediaMeta.find({ _id: { $in: mediaMetaIds } }).lean();
        const mediaMetaMap = new Map();
        mediaMetaDocs.forEach(doc => mediaMetaMap.set(doc?.mediaFileId, doc));
        mediaMetaDocs.forEach(doc => mediaMetaMap.set(doc?.thumbnailId, doc));
        const mediaFileIds = mediaMetaDocs.map((doc) => doc.mediaFileId);
        const thumbnailIds = mediaMetaDocs.map((doc) => doc?.thumbnailId || null);

        const fileDetails = await fileModel
            .find({ fileId: { $in: [...mediaFileIds, ...thumbnailIds] } })
            .lean();

        // Map file details to mediaMetaMap
        const urlDetailsWithmediaMetaMap = new Map();
        fileDetails.forEach((eachFile) => {
            const mediaDocs = mediaMetaMap.get(eachFile.fileId);
            if (urlDetailsWithmediaMetaMap.has(mediaDocs._id)) {
                const existingMediaMeta = urlDetailsWithmediaMetaMap.get(mediaDocs._id);
                if (eachFile.containerName === "thumbnails") {
                    const updatedExistingMedia = {
                        ...existingMediaMeta,
                        thumbnailDetails: {
                            fileId: eachFile.fileId,
                            fileName: eachFile.originalName,
                            length: eachFile.size,
                            visibility: eachFile.visibility,
                            url: eachFile.url,
                            id: eachFile._id,
                        },
                    };
                    urlDetailsWithmediaMetaMap.set(mediaDocs._id, updatedExistingMedia);
                } else {
                    const updatedExistingMedia = {
                        ...existingMediaMeta,
                        mediaDetails: {
                            fileId: eachFile.fileId,
                            fileName: eachFile.originalName,
                            length: eachFile.size,
                            visibility: eachFile.visibility,
                            url: eachFile.url,
                            id: eachFile._id,
                        },
                    };
                    urlDetailsWithmediaMetaMap.set(mediaDocs._id, updatedExistingMedia);
                }
            } else {
                const newExistingMediaPayload = {
                    ...mediaDocs,
                };
                const urlDetails = {
                    fileId: eachFile.fileId,
                    fileName: eachFile.originalName,
                    length: eachFile.size,
                    visibility: eachFile.visibility,
                    url: eachFile.url,
                    id: eachFile._id,
                };
                if (
                    eachFile.containerName === "thumbnails" ||
          eachFile.containerName === "thumbnail"
                ) {
                    newExistingMediaPayload.thumbnailDetails = urlDetails;
                } else {
                    newExistingMediaPayload.mediaDetails = urlDetails;
                }
                urlDetailsWithmediaMetaMap.set(mediaDocs._id, newExistingMediaPayload);
            }
        });

        const urlDetailsWithmediaMeta = [];


        // Collect user IDs
        const userIds = videos.results.map(v => v.user).filter(Boolean);
        const userDocs = await UserCredential.find({ _id: { $in: userIds } })
            .select("_id username profilePicture displayName bio")
            .lean();
        const userMap = new Map();
        userDocs.forEach(doc => userMap.set(doc._id.toString(), doc));


        // Collect category IDs
        const categoryIds = videos.results.map(v => v.category).filter(Boolean);
        const categoryDocs = await Category.find({ _id: { $in: categoryIds } })
            .select("_id name description")
            .lean();
        const categoryMap = new Map();
        categoryDocs.forEach(doc => categoryMap.set(doc._id.toString(), doc));


        videos.results.forEach(item => {
            const payload = {
                ...item,
                ...urlDetailsWithmediaMetaMap.get(
                    item?.videoSpecific?.mediaMetaId || item?.reelSpecific?.mediaMetaId,
                ),
                user: userMap.get(item?.user?.toString()),
                id: item._id,
                category: item.category ? categoryMap.get(item?.category?.toString()) : null
            }
            delete payload._id;
            delete payload.__v;
            urlDetailsWithmediaMeta.push(payload);
        });
        videos.results = urlDetailsWithmediaMeta;
  
        // Format response
        return videos;
    } catch (error) {
        logger.error("Error in getTrendingVideos:", error);
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Error fetching trending videos"
        );
    }
};
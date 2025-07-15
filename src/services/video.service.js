const Video = require("../models/video.model");
const MediaMeta = require("../models/mediaMeta.model");
const Category = require("../models/category.model");
const videoEventService = require("./videoEvent.service");
const logger = require("../features/logger");
const { ApiError } = require('../features/error');
const httpStatus = require("http-status");
const UserCredential = require('../models/userCredentials.model');
const File = require("../models/file.model");

/**
 * Create a new video
 * @param {Object} videoData - The video data
 * @param {string} userId - The ID of the user creating the video
 * @returns {Promise<Video>}
 */
exports.createVideo = async (videoData, userId) => {
    try {
        // Verify media metadata exists
        const thumbnailMetadata = await MediaMeta.findById(videoData.thumbnailMetadata);
        if (!thumbnailMetadata) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid thumbnail metadata ID");
        }

        const contentMetadata = await MediaMeta.findById(videoData.contentMetadata);
        if (!contentMetadata) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid content metadata ID");
        }

        const video = new Video({
            ...videoData,
            type: 'video',
            author: userId,
            videoSpecific: {
                description: videoData.description,
                duration: videoData.duration,
                thumbnailMetadata: thumbnailMetadata._id,
                contentMetadata: contentMetadata._id
            },
            status: videoData.status || 'draft',
            featured: videoData.featured || false
        });
        
        await video.save();
        
        // Publish video created event
        const publishSuccess = await videoEventService.publishVideoCreated(video);
        
        if (!publishSuccess) {
            logger.warn(`Video created but event publishing failed for video ID ${video._id}`);
        }

        return video;
    } catch (error) {
        logger.error("Error in createVideo service:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.BAD_REQUEST, "Error creating video");
    }
};

/**
 * Get all videos with pagination and filters
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {string} [options.category] - Category filter
 * @param {string} [options.sortBy] - Sort field
 * @param {string} [options.sortOrder] - Sort order (asc/desc)
 * @param {boolean} [options.featured] - Featured filter
 * @returns {Promise<Object>} Videos data with pagination
 */
exports.getAllVideos = async (options) => {
    try {
        const { page = 1, limit = 10, category, sortBy = 'createdAt', sortOrder = 'desc', featured } = options;
        const skip = (page - 1) * limit;

        // Build query
        const query = { status: 'published' };
        if (category) query.category = category;
        if (featured) query.isFeatured = true;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // First fetch videos with basic info
        const videos = await Video.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count
        const total = await Video.countDocuments(query);

        // Collect all MediaMeta IDs
        const mediaMetaIds = videos.map(video => video.videoSpecific.mediaMetaId);

        // Fetch all MediaMeta documents in one query
        const mediaMetaMap = new Map();
        const mediaMetaDocs = await MediaMeta.find({ _id: { $in: mediaMetaIds } })
            .select('_id url type metadata mediaFileId thumbnailId')
            .lean();
        mediaMetaDocs.forEach(doc => mediaMetaMap.set(doc._id.toString(), doc));
        console.log("🚀 ~ :105 ~ exports.getAllVideos= ~ mediaMetaDocs:", mediaMetaDocs)

        // Collect all file IDs
        const fileIds = new Set();
        mediaMetaDocs.forEach(doc => {
            if (doc.mediaFileId) fileIds.add(doc.mediaFileId);
            if (doc.thumbnailId) fileIds.add(doc.thumbnailId);
        });

        // Fetch all file documents in one query
        const fileMap = new Map();
        const fileDocs = await File.find({ fileId: { $in: Array.from(fileIds) } })
            .select('fileId url type metadata')
            .lean();
        fileDocs.forEach(doc => fileMap.set(doc.fileId, doc));

        // Format videos with populated data
        const formattedVideos = videos.map(video => {
            const mediaMeta = mediaMetaMap.get(video.videoSpecific.mediaMetaId.toString());
            const mediaFile = mediaMeta ? fileMap.get(mediaMeta.mediaFileId) : null;
            const thumbnailFile = mediaMeta ? fileMap.get(mediaMeta.thumbnailId) : null;

            return {
                ...video,
                mediaFile: mediaFile ? {
                    url: mediaFile.url,
                    type: mediaFile.type,
                    metadata: mediaFile.metadata
                } : null,
                thumbnail: thumbnailFile ? {
                    url: thumbnailFile.url,
                    type: thumbnailFile.type,
                    metadata: thumbnailFile.metadata
                } : null,
                duration: video.videoSpecific.duration || '00:00:00'
            };
        });

        const totalPages = Math.ceil(total / limit);
        const hasMore    = skip + limit < total;

        return {
            results: formattedVideos,
            skip,
            limit,
            hasMore,
            totalPages,
            totalResults: total
        };
    } catch (error) {
        logger.error('Error in getAllVideos:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching videos');
    }
};

/**
 * Get video by ID
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Video data
 */
exports.getVideoById = async (videoId) => {
    try {
        // First fetch video with basic info
        const video = await Video.findById(videoId).lean();

        if (!video) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
        }

        // Get MediaMeta document
        const mediaMeta = await MediaMeta.findById(video.videoSpecific.mediaMetaId)
            .select('_id url type metadata mediaFileId thumbnailId')
            .lean();

        if (!mediaMeta) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Media metadata not found');
        }

        // Get file documents
        const fileIds = new Set();
        if (mediaMeta.mediaFileId) fileIds.add(mediaMeta.mediaFileId);
        if (mediaMeta.thumbnailId) fileIds.add(mediaMeta.thumbnailId);

        const fileDocs = await File.find({ fileId: { $in: Array.from(fileIds) } })
            .select('fileId url type metadata')
            .lean();

        const fileMap = new Map();
        fileDocs.forEach(doc => fileMap.set(doc.fileId, doc));

        // Get user data
        const user = await UserCredential.findById(video.author)
            .select('_id username profilePicture displayName bio')
            .lean();

        // Get category data
        const category = await Category.findById(video.category)
            .select('_id name description')
            .lean();

        // Format video with populated data
        return {
            ...video,
            user: user || null,
            category: category || null,
            mediaFile: fileMap.get(mediaMeta.mediaFileId) ? {
                url: fileMap.get(mediaMeta.mediaFileId).url,
                type: fileMap.get(mediaMeta.mediaFileId).type,
                metadata: fileMap.get(mediaMeta.mediaFileId).metadata
            } : null,
            thumbnail: fileMap.get(mediaMeta.thumbnailId) ? {
                url: fileMap.get(mediaMeta.thumbnailId).url,
                type: fileMap.get(mediaMeta.thumbnailId).type,
                metadata: fileMap.get(mediaMeta.thumbnailId).metadata
            } : null,
            duration: video.videoSpecific.duration || '00:00:00'
        };
    } catch (error) {
        logger.error('Error in getVideoById:', error);
        throw error;
    }
};

/**
 * Update a video
 * @param {string} id - Video ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Video>}
 */
exports.updateVideo = async (id, updateData) => {
    try {
        const video = await Video.findByIdAndUpdate(
            id,
            { 
                $set: {
                    ...updateData,
                    videoSpecific: {
                        videoUrl: updateData.video,
                        duration: updateData.duration
                    }
                }
            },
            { new: true, runValidators: true }
        );
        
        if (!video) {
            throw new ApiError(httpStatus.NOT_FOUND, "Video not found");
        }
        
        // Publish video updated event
        const publishSuccess = await videoEventService.publishVideoUpdated(video);
        
        if (!publishSuccess) {
            logger.warn(`Video updated but event publishing failed for video ID ${video._id}`);
        }

        return video;
    } catch (error) {
        logger.error(`Error in updateVideo service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating video");
    }
};

/**
 * Delete a video (soft delete)
 * @param {string} id - Video ID
 * @returns {Promise<Video>}
 */
exports.deleteVideo = async (id) => {
    try {
        const video = await Video.findByIdAndUpdate(
            id,
            { $set: { deletedAt: new Date() } },
            { new: true, runValidators: true }
        );
        
        if (!video) {
            throw new ApiError(httpStatus.NOT_FOUND, "Video not found");
        }
        
        // Publish video deleted event
        const publishSuccess = await videoEventService.publishVideoDeleted(video._id);
        
        if (!publishSuccess) {
            logger.warn(`Video deleted but event publishing failed for video ID ${video._id}`);
        }

        return video;
    } catch (error) {
        logger.error(`Error in deleteVideo service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting video");
    }
}; 
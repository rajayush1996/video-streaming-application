const mediaMetaService = require("../services/mediaMeta.service");
const httpStatus = require("http-status");
const logger = require("../features/logger");

/**
 * Get media metadata with pagination
 * @route GET /api/v1/media-metadata
 */
exports.getMediaMetadata = async (req, res, next) => {
    try {
        // Extract query parameters (already validated by Joi)
        const { page, limit, sortBy, thumbnailId, mediaFileId } = req.query;
        
        // Build filter
        const filter = {};
        if (thumbnailId) filter.thumbnailId = thumbnailId;
        if (mediaFileId) filter.mediaFileId = mediaFileId;
        
        // Build options
        const options = {};
        if (page) options.page = parseInt(page);
        if (limit) options.limit = parseInt(limit);
        if (sortBy) options.sortBy = sortBy;
        
        // Get paginated results with URLs
        const result = await mediaMetaService.getMediaMetadata(filter, options);
        
        return res.status(httpStatus.OK).json({
            ...result,
            message: "Media metadata retrieved successfully with URLs"
        });
    } catch (error) {
        logger.error("Error fetching media metadata:", error);
        next(error);
    }
}; 
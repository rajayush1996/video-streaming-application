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

/**
 * Update media metadata
 * @route PATCH /api/v1/media-metadata/:id
 */
exports.updateMediaMetadata = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateBody = req.body;
        
        const result = await mediaMetaService.updateMediaMetadata(id, updateBody);
        
        return res.status(httpStatus.OK).json({
            data: result,
            message: "Media metadata updated successfully"
        });
    } catch (error) {
        logger.error("Error updating media metadata:", error);
        next(error);
    }
};

/**
 * Delete media metadata (soft delete)
 * @route DELETE /api/v1/media-metadata/:id
 */
exports.deleteMediaMetadata = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await mediaMetaService.deleteMediaMetadata(id);
        
        return res.status(httpStatus.OK).json({
            data: result,
            message: "Media metadata deleted successfully"
        });
    } catch (error) {
        logger.error("Error deleting media metadata:", error);
        next(error);
    }
};

/**
 * Restore soft-deleted media metadata
 * @route POST /api/v1/media-metadata/:id/restore
 */
exports.restoreMediaMetadata = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await mediaMetaService.restoreMediaMetadata(id);
        
        return res.status(httpStatus.OK).json({
            data: result,
            message: "Media metadata restored successfully"
        });
    } catch (error) {
        logger.error("Error restoring media metadata:", error);
        next(error);
    }
};

/**
 * Increment view count for a video
 * @route PUT /api/v1/media-metadata/:id/view
 * @param {string} req.params.id - Media metadata ID
 * @returns {Object} - Updated view count
 */
exports.incrementViewCount = async (req, res, next) => {
    try {
        const result = await mediaMetaService.incrementViewCount(req.params.id);
        return res.status(httpStatus.OK).json({ 
            success: true,
            message: 'View count incremented successfully',
            data: result
        });
    } catch (error) {
        logger.error(`Error incrementing view count for ID ${req.params.id}:`, error);
        next(error);
    }
}; 
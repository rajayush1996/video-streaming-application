const mediaMetaService = require("../services/mediaMeta.service");
const httpStatus = require("http-status");
const logger = require("../features/logger");

const mediaMetaController = {
    getMediaMetadata: async (req, res, next) => {
        console.log("🚀 ~ :7 ~ req:", req.user);
        try {
        // Extract query parameters (already validated by Joi)
            const { page, limit, sortBy, thumbnailId, mediaFileId, type, category='all' } = req.query;
        
            // Build filter
            const filter = {};
            if (thumbnailId) filter.thumbnailId = thumbnailId;
            if (mediaFileId) filter.mediaFileId = mediaFileId;
        
            // Build options
            const options = {};
            if (page) options.page = parseInt(page);
            if (limit) options.limit = parseInt(limit);
            if (sortBy) options.sortBy = sortBy;
            if (type) options.type = type;
            if(category) options.category = category;
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
    },

    updateMediaMetadata: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updateBody = req.body;
        
            const result = await mediaMetaService.updateMediaMetadata(id, updateBody);
            console.log("🚀 ~ :41 ~ updateMediaMetadata: ~ result:", result);
        
            return res.status(httpStatus.OK).json({
                data: result,
                message: "Media metadata updated successfully"
            });
        } catch (error) {
            logger.error("Error updating media metadata:", error);
            next(error);
        }
    },

    deleteMediaMetadata: async (req, res, next) => {
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
    },

    restoreMediaMetadata: async (req, res, next) => {
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
    },

    incrementViewCount: async (req, res, next) => {
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
    },

    approveMedia: async (req, res, next) => {
        try {
            const media = await mediaMetaService.approveMedia(req.params.id, req.user.id);
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Media approved successfully',
                data: media
            });
        } catch (error) {
            logger.error(`Error approving media for ID ${req.params.id}:`, error);
            next(error);
        }
    },

    rejectMedia: async (req, res, next) => {
        try {
            const media = await mediaMetaService.rejectMedia(req.params.id, req.user.id, req.body.rejectionReason);
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Media rejected successfully',
                data: media
            });
        } catch (error) {
            logger.error(`Error rejecting media for ID ${req.params.id}:`, error);
            next(error);
        }
    },

    getPendingMedia: async (req, res, next) => {
        try {
            const result = await mediaMetaService.getPendingMedia(req.query);
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Pending media retrieved successfully',
                data: result
            });
        } catch (error) {
            logger.error('Error fetching pending media:', error);
            next(error);
        }
    },

    getApprovedMedia: async (req, res, next) => {
        try {
            const result = await mediaMetaService.getApprovedMedia(req.query);
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Approved media retrieved successfully',
                data: result
            });
        } catch (error) {
            logger.error('Error fetching approved media:', error);
            next(error);
        }
    },

    getRejectedMedia: async (req, res, next) => {
        try {
            const result = await mediaMetaService.getRejectedMedia(req.query);
            res.status(httpStatus.OK).json({
                success: true,
                message: 'Rejected media retrieved successfully',
                data: result
            });
        } catch (error) {
            logger.error('Error fetching rejected media:', error);
            next(error);
        }
    },

    createMediaMetaDetails: async (req, res, next) => {
        try {
            const { body } = req;
            // console.log("🚀 ~ createMediaMetaDetails: ~ body:", body);
            const role = req.user?.role;
            
            // Add userId from JWT authentication
            if (req.user && req.user.id) {
                body.userId = req.user.id;
            } else {
                logger.warn("No user ID found in JWT token for media upload");
            }
            
            const result = await mediaMetaService.createMediaMetaInfo(body, role);
            return res.status(httpStatus.OK).json({
                success: true,
                message: role === 'admin' ? 'Media created and approved successfully' : 'Media created and pending approval',
                data: result
            });
        } catch (error) {
            logger.error(error);
            next(error);
        }
    },

    getMediaMetadataById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const result = await mediaMetaService.getMediaMetadataById(id);
            return res.status(httpStatus.OK).json({
                success: true,
                message: 'Media metadata retrieved successfully',
                data: result
            });
        } catch (error) {
            logger.error(`Error fetching media metadata for ID ${req.params.id}:`, error);
            next(error);
        }
    }
};

module.exports = { mediaMetaController }; 
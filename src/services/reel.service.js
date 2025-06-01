const Reel = require("../models/reel.model");
const MediaMeta = require("../models/mediaMeta.model");
const Category = require("../models/category.model");
const reelEventService = require("./reelEvent.service");
const logger = require("../features/logger");
const { ApiError } = require('../features/error');
const httpStatus = require("http-status");

/**
 * Create a new reel
 * @param {Object} reelData - The reel data
 * @param {string} userId - The ID of the user creating the reel
 * @returns {Promise<Reel>}
 */
exports.createReel = async (reelData, userId) => {
    try {
        // Verify media metadata exists
        const thumbnailMetadata = await MediaMeta.findById(reelData.thumbnailMetadata);
        if (!thumbnailMetadata) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid thumbnail metadata ID");
        }

        const contentMetadata = await MediaMeta.findById(reelData.contentMetadata);
        if (!contentMetadata) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid content metadata ID");
        }

        // Create the reel
        const reel = new Reel({
            ...reelData,
            type: 'reel',
            author: userId,
            reelSpecific: {
                description: reelData.description,
                duration: reelData.duration,
                thumbnailMetadata: thumbnailMetadata._id,
                contentMetadata: contentMetadata._id
            },
            status: reelData.status || 'draft',
            featured: reelData.featured || false
        });
        
        await reel.save();
        
        // Publish reel created event
        const publishSuccess = await reelEventService.publishReelCreated(reel);
        
        if (!publishSuccess) {
            logger.warn(`Reel created but event publishing failed for reel ID ${reel._id}`);
        }

        return reel;
    } catch (error) {
        logger.error("Error in createReel service:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.BAD_REQUEST, "Error creating reel");
    }
};

/**
 * Get all reels with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<{results: Array, page: number, limit: number, totalPages: number, totalResults: number}>}
 */
exports.getAllReels = async (filter = {}, options = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt:desc",
            includeDeleted = false,
            categoryId,
            featured,
        } = options;
  
        // Add deletedAt filter if not including deleted reels
        if (!includeDeleted) {
            filter.deletedAt = null;
        }

        // Add category filter if provided
        if (categoryId) {
            // Verify category exists
            const category = await Category.findById(categoryId);
            if (!category) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category ID");
            }
            filter['reelSpecific.categoryId'] = categoryId;
        }

        // Add featured filter if provided
        if (featured !== undefined) {
            filter.featured = featured;
        }
  
        const reels = await Reel.paginate(filter, {
            page,
            limit,
            sortBy,
            populate: [
                { path: 'author', select: 'name email' },
                { 
                    path: 'reelSpecific.thumbnailMetadata',
                    model: 'MediaMeta'
                },
                { 
                    path: 'reelSpecific.contentMetadata',
                    model: 'MediaMeta'
                },
                { 
                    path: 'reelSpecific.categoryId',
                    model: 'Category',
                    select: 'name slug description icon status',
                    populate: {
                        path: 'icon',
                        model: 'MediaMeta'
                    }
                }
            ],
            lean: true,
        });
  
        return reels;
    } catch (error) {
        logger.error("Error in getAllReels service:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching reels");
    }
};

/**
 * Get a reel by ID
 * @param {string} id - Reel ID
 * @param {boolean} includeDeleted - Whether to include soft-deleted reels
 * @returns {Promise<Reel>}
 */
exports.getReelById = async (id, includeDeleted = false) => {
    try {
        const query = Reel.findById(id);
        
        // Add deletedAt filter if not including deleted reels
        if (!includeDeleted) {
            query.where({ deletedAt: null });
        }
        
        const reel = await query
            .populate('author', 'name email')
            .populate({
                path: 'reelSpecific.thumbnailMetadata',
                model: 'MediaMeta'
            })
            .populate({
                path: 'reelSpecific.contentMetadata',
                model: 'MediaMeta'
            })
            .populate({
                path: 'reelSpecific.categoryId',
                select: 'name slug description icon status',
                populate: {
                    path: 'icon',
                    model: 'MediaMeta'
                }
            })
            .lean();
        
        if (!reel) {
            throw new ApiError(httpStatus.NOT_FOUND, "Reel not found");
        }
        return reel;
    } catch (error) {
        logger.error(`Error in getReelById service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching reel");
    }
};

/**
 * Update a reel
 * @param {string} id - Reel ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Reel>}
 */
exports.updateReel = async (id, updateData) => {
    try {
        const reel = await Reel.findById(id);
        if (!reel) {
            throw new ApiError(httpStatus.NOT_FOUND, "Reel not found");
        }

        // Update thumbnail metadata if thumbnail is being updated
        if (updateData.thumbnail) {
            const thumbnailMetadata = await MediaMeta.findById(reel.reelSpecific.thumbnailMetadata);
            if (thumbnailMetadata) {
                thumbnailMetadata.thumbnailId = updateData.thumbnail;
                await thumbnailMetadata.save();
            }
        }

        // Update content metadata if content is being updated
        if (updateData.content) {
            const contentMetadata = await MediaMeta.findById(reel.reelSpecific.contentMetadata);
            if (contentMetadata) {
                contentMetadata.mediaFileId = updateData.content;
                contentMetadata.status = 'pending'; // Reset status for new content
                await contentMetadata.save();
            }
        }

        // Update reel
        const updatedReel = await Reel.findByIdAndUpdate(
            id,
            { 
                $set: {
                    ...updateData,
                    reelSpecific: {
                        ...reel.reelSpecific,
                        description: updateData.description,
                        duration: updateData.duration
                    }
                }
            },
            { new: true, runValidators: true }
        );
        
        // Publish reel updated event
        const publishSuccess = await reelEventService.publishReelUpdated(updatedReel);
        
        if (!publishSuccess) {
            logger.warn(`Reel updated but event publishing failed for reel ID ${updatedReel._id}`);
        }

        return updatedReel;
    } catch (error) {
        logger.error(`Error in updateReel service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating reel");
    }
};

/**
 * Delete a reel (soft delete)
 * @param {string} id - Reel ID
 * @returns {Promise<Reel>}
 */
exports.deleteReel = async (id) => {
    try {
        const reel = await Reel.findById(id);
        if (!reel) {
            throw new ApiError(httpStatus.NOT_FOUND, "Reel not found");
        }

        // Soft delete associated media metadata
        await MediaMeta.findByIdAndUpdate(reel.reelSpecific.thumbnailMetadata, { isDeleted: true, deletedAt: new Date() });
        await MediaMeta.findByIdAndUpdate(reel.reelSpecific.contentMetadata, { isDeleted: true, deletedAt: new Date() });

        // Soft delete the reel
        const deletedReel = await Reel.findByIdAndUpdate(
            id,
            { $set: { deletedAt: new Date() } },
            { new: true, runValidators: true }
        );
        
        // Publish reel deleted event
        const publishSuccess = await reelEventService.publishReelDeleted(deletedReel._id);
        
        if (!publishSuccess) {
            logger.warn(`Reel deleted but event publishing failed for reel ID ${deletedReel._id}`);
        }

        return deletedReel;
    } catch (error) {
        logger.error(`Error in deleteReel service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting reel");
    }
}; 
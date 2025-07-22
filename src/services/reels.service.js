const MediaMeta = require('../models/mediaMeta.model');
const File = require('../models/file.model');
const httpStatus = require('http-status');
const logger = require('../features/logger');
const { ApiError } = require('../features/error');
// const { formatApiResult } = require('../utils/formatApiResult.util');
const { getVideoMetadata } = require('./videoMetaData.service');

/**
 * Reels Service - Handles all reels-specific operations
 */
class ReelsService {
    /**
     * Get all reels with pagination
     * @param {Object} filter - Filter criteria
     * @param {Object} options - Query options like sort, pagination
     * @returns {Promise<Object>} Paginated reels
     */
    // async getAllReels(filter = {}, options = {}) {
    //     try {
    //         // Set media type to 'reel' for reels-specific queries
    //         filter.mediaType = 'reel';
    //         filter.isDeleted = false;

    //         const reels = await MediaMeta.paginate(filter, options);
    //         // Format results and enhance with file URLs
    //         if (reels.results && reels.results.length > 0) {
    //             // Convert each reels to plain object and remove mongoose internals
    //             const plainResults = reels.results.map(doc => {
    //                 const plainObject = doc.toObject ? doc.toObject() : doc;
    //                 delete plainObject.__v;
    //                 delete plainObject.$__;
    //                 delete plainObject.$isNew;
    //                 delete plainObject._doc;
    //                 return plainObject;
    //             });
                
    //             reels.results = formatApiResult(plainResults);
    //             const enhancedResults = await this.enhanceWithFileUrls(reels.results);
    //             reels.results = enhancedResults;
    //         }

    //         // Enhance reels with file URLs
    //         const enhancedResults = await this.enhanceWithFileUrls(reels.results);

    //         return {
    //             ...reels,
    //             results: enhancedResults
    //         };
    //     } catch (error) {
    //         logger.error('Error fetching reels:', error);
    //         throw error;
    //     }
    // }

    async getAllReels(filter = {}, options = {} ) {
        try {
            filter.mediaType = 'reel'
            const result = await getVideoMetadata(filter, options);
            return result;
        } catch(error) {
            logger.error('Error fetching reels:', error);
            throw error;
        }
    }
    /**
     * Get a single reel by ID
     * @param {string} id - Reel ID
     * @returns {Promise<Object>} - Reel details
     */
    async getReelById(id) {
        try {
            const reel = await MediaMeta.findOne({ 
                _id: id, 
                mediaType: 'reel',
                isDeleted: false 
            });

            if (!reel) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Reel not found');
            }

            // Enhance with file URLs
            const enhancedReel = await this.enhanceWithFileUrls([reel]);
            return enhancedReel[0];
        } catch (error) {
            logger.error(`Error fetching reel with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update reel metadata
     * @param {string} id - Reel ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} - Updated reel
     */
    async updateReel(id, updateData) {
        try {
            // Verify this is a reel before updating
            const reel = await MediaMeta.findOne({ 
                _id: id, 
                mediaType: 'reel',
                isDeleted: false 
            });

            if (!reel) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Reel not found');
            }

            // Don't allow changing mediaType
            if (updateData.mediaType && updateData.mediaType !== 'reel') {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change media type for a reel');
            }

            const updatedReel = await MediaMeta.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            // Enhance with file URLs
            const enhancedReel = await this.enhanceWithFileUrls([updatedReel]);
            return enhancedReel[0];
        } catch (error) {
            logger.error(`Error updating reel with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Soft delete a reel
     * @param {string} id - Reel ID
     * @returns {Promise<Object>} - Deletion result
     */
    async softDeleteReel(id) {
        try {
            // Verify this is a reel before deleting
            const reel = await MediaMeta.findOne({ 
                _id: id, 
                mediaType: 'reel',
                isDeleted: false 
            });

            if (!reel) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Reel not found');
            }

            const deletedReel = await MediaMeta.findByIdAndUpdate(
                id,
                {
                    isDeleted: true,
                    deletedAt: new Date()
                },
                { new: true }
            );

            return {
                success: true,
                message: 'Reel deleted successfully',
                id: deletedReel._id
            };
        } catch (error) {
            logger.error(`Error deleting reel with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Enhance reels with file URLs
     * @param {Array} reels - Array of reel objects
     * @returns {Promise<Array>} - Enhanced reels with URLs
     */
    async enhanceWithFileUrls(reels) {
        try {
            if (!reels || reels.length === 0) return [];

            // Extract all file IDs
            const thumbnailIds = reels.map(item => item.thumbnailId).filter(Boolean);
            const mediaFileIds = reels.map(item => item.mediaFileId).filter(Boolean);
            const allFileIds = [...thumbnailIds, ...mediaFileIds];

            // Batch fetch all files in one query
            const files = await File.find({
                $or: [
                    { fileId: { $in: allFileIds } },
                    { blobName: { $in: allFileIds } }
                ]
            });

            // Create a map for quick lookup
            const fileMap = {};
            files.forEach(file => {
                fileMap[file.fileId] = file;
                if (file.blobName) fileMap[file.blobName] = file;
            });

            // Enhance each reel with URLs
            return reels.map(item => {
                const enhancedItem = item.toObject ? item.toObject() : { ...item };
                
                // Find thumbnail URL
                let thumbnailUrl = null;
                if (item.thumbnailId) {
                    const thumbnail = fileMap[item.thumbnailId];
                    if (thumbnail) thumbnailUrl = thumbnail.url;
                }
                
                // Find media file URL
                let mediaFileUrl = null;
                if (item.mediaFileId) {
                    const mediaFile = fileMap[item.mediaFileId];
                    if (mediaFile) mediaFileUrl = mediaFile.url;
                    
                    if (!mediaFileUrl) {
                        // Try to match partial ID
                        const mediaFile = files.find(f => 
                            (f.fileId && f.fileId.includes(item.mediaFileId.split('.')[0])) || 
                            (f.blobName && f.blobName.includes(item.mediaFileId))
                        );
                        if (mediaFile) mediaFileUrl = mediaFile.url;
                    }
                }
                
                enhancedItem.thumbnailUrl = thumbnailUrl || null;
                enhancedItem.mediaFileUrl = mediaFileUrl || null;
                return enhancedItem;
            });
        } catch (error) {
            logger.error("Error enhancing reels with file URLs:", error);
            return reels;
        }
    }
}

module.exports = new ReelsService(); 
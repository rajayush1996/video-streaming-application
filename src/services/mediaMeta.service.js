const MediaMeta = require("../models/mediaMeta.model");
const File = require("../models/file.model");

class MediaMetaService {
    async createMediaMetaInfo(metaInfo) {
        try {
            return MediaMeta.create(metaInfo);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get media metadata with pagination
     * @param {Object} filter - Mongo filter
     * @param {Object} options - Query options
     * @param {string} [options.sortBy] - Sorting criteria using the format: sortField:(desc|asc)
     * @param {number} [options.limit] - Maximum number of results per page (default = 10)
     * @param {number} [options.page] - Current page (default = 1)
     * @returns {Promise<Object>} - Paginated results
     */
    async getMediaMetadata(filter = {}, options = {}) {
        try {
            // Default options
            const defaultOptions = {
                sortBy: 'createdAt:desc',
                limit: 10,
                page: 1
            };
            
            // Merge with provided options
            const queryOptions = { ...defaultOptions, ...options };
            
            // Use the paginate plugin
            const result = await MediaMeta.paginate(filter, queryOptions);
            
            // Enhance results with file URLs
            if (result.results && result.results.length > 0) {
                const enhancedResults = await this.enhanceWithFileUrls(result.results);
                result.results = enhancedResults;
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Enhance media metadata with file URLs
     * @param {Array} mediaMetadata - Array of media metadata objects
     * @returns {Promise<Array>} - Enhanced media metadata with URLs
     */
    async enhanceWithFileUrls(mediaMetadata) {
        try {
            // Extract all thumbnailIds and mediaFileIds
            const thumbnailIds = mediaMetadata.map(item => item.thumbnailId);
            const mediaFileIds = mediaMetadata.map(item => item.mediaFileId);
            
            // Remove file extensions from IDs for matching with fileId in the database
            const thumbnailIdsWithoutExt = thumbnailIds.map(id => {
                // Handle both formats: "vid-1743733224619_thumb.jpg" and "thumb_vid-1743734282681_thumb"
                if (id.includes('_thumb')) {
                    // If it's a thumbnail, it might be in the format "thumb_vid-1743734282681_thumb"
                    return id.replace(/\.(jpg|jpeg|png)$/, '');
                }
                // For regular files, just remove the extension
                return id.split('.')[0];
            });
            
            const mediaFileIdsWithoutExt = mediaFileIds.map(id => {
                // For media files, just remove the extension
                return id.split('.')[0];
            });
            
            // Fetch all files in one query
            const files = await File.find({
                $or: [
                    { fileId: { $in: [...thumbnailIdsWithoutExt, ...mediaFileIdsWithoutExt] } },
                    { blobName: { $in: [...thumbnailIds, ...mediaFileIds] } }
                ]
            });
            
            // Create a map for quick lookup
            const fileMap = {};
            files.forEach(file => {
                // Handle both Mongoose documents and plain objects
                const fileId = file.fileId || file._id;
                const blobName = file.blobName;
                const url = file.url;
                
                if (fileId && url) {
                    fileMap[fileId] = url;
                }
                
                if (blobName && url) {
                    fileMap[blobName] = url;
                }
            });
            
            // Enhance each media metadata with URLs
            return mediaMetadata.map(item => {
                const enhancedItem = item.toObject ? item.toObject() : { ...item };
                
                // Try to find the URL using the exact ID first
                let thumbnailUrl = fileMap[item.thumbnailId];
                let mediaFileUrl = fileMap[item.mediaFileId];
                
                // If not found, try to find by ID without extension
                if (!thumbnailUrl) {
                    const thumbnailIdWithoutExt = item.thumbnailId.includes('_thumb') 
                        ? item.thumbnailId.replace(/\.(jpg|jpeg|png)$/, '')
                        : item.thumbnailId.split('.')[0];
                    thumbnailUrl = fileMap[thumbnailIdWithoutExt];
                }
                
                if (!mediaFileUrl) {
                    const mediaFileIdWithoutExt = item.mediaFileId.split('.')[0];
                    mediaFileUrl = fileMap[mediaFileIdWithoutExt];
                }
                
                // If still not found, try to find by partial match
                if (!thumbnailUrl) {
                    const thumbnailFile = files.find(f => 
                        (f.fileId && f.fileId.includes(item.thumbnailId.split('.')[0])) || 
                        (f.blobName && f.blobName.includes(item.thumbnailId))
                    );
                    if (thumbnailFile) thumbnailUrl = thumbnailFile.url;
                }
                
                if (!mediaFileUrl) {
                    const mediaFile = files.find(f => 
                        (f.fileId && f.fileId.includes(item.mediaFileId.split('.')[0])) || 
                        (f.blobName && f.blobName.includes(item.mediaFileId))
                    );
                    if (mediaFile) mediaFileUrl = mediaFile.url;
                }
                
                enhancedItem.thumbnailUrl = thumbnailUrl || null;
                enhancedItem.mediaFileUrl = mediaFileUrl || null;
                return enhancedItem;
            });
        } catch (error) {
            console.error("Error enhancing with file URLs:", error);
            return mediaMetadata;
        }
    }
}

module.exports = new MediaMetaService();
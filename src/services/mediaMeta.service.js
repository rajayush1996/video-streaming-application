const MediaMeta = require("../models/mediaMeta.model");
const File = require("../models/file.model");
const { formatApiResult } = require("../utils/formatApiResult.util");
const { ApiError } = require("../features/error");
const httpStatus = require("http-status");
const socketService = require("./socket.service");
const mongoose   = require('mongoose')

class MediaMetaService {
    async createMediaMetaInfo(metaInfo) {
        try {
            const mediaMeta = await MediaMeta.create(metaInfo);

            // Notify admins about new content that needs approval
            socketService.notifyNewContent(mediaMeta);

            return mediaMeta;
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
   * @param {string} [options.category] - Filter by category
   * @returns {Promise<Object>} - Paginated results
   */
    async getMediaMetadata(rawFilter = {}, options = {}) {
        try {
            // 1) Destructure & default our paging/sort options:
            const {
                page = 1,
                limit = 10,
                sortBy = "createdAt:desc",
                category,
                ...otherOptions
            } = options;

            // 2) Build a clean filter object—strip out any stray page/limit/sortBy:
            const filter = { ...rawFilter };
            delete filter.page;
            delete filter.limit;
            delete filter.sortBy;
            delete filter.category;

            // 3) Default isDeleted to false, if not provided:
            if (filter.isDeleted === undefined) {
                filter.isDeleted = false;
            }

            // 4) Apply category logic:
            if (category && category !== "all") {
                filter.category = category;
            }

            console.log("→ final filter:", filter);
            console.log("→ query options:", { page, limit, sortBy, ...otherOptions });

            // 5) Call your paginate plugin
            const result = await MediaMeta.paginate(filter, {
                page,
                limit,
                sortBy,
                lean: true,
                ...otherOptions,
            });

            // 6) (optional) strip mongoose internals & enhance
            if (Array.isArray(result.results) && result.results.length) {
                const plain = result.results.map((doc) =>
                    doc.toObject ? doc.toObject() : doc
                );
                result.results = formatApiResult(plain);
                result.results = await this.enhanceWithFileUrls(result.results);
            }

            return result;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Get media metadata by ID
     * @param {string} id - Media metadata ID
     * @returns {Promise<Object>} - Media metadata with enhanced URLs
     */
    async getMediaMetadataById(id) {
        // 1) Sanity‐check the incoming ID
        if (!mongoose.isValidObjectId(id)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid media metadata ID')
        }
        
        // force it to an ObjectId
        const objId = new mongoose.Types.ObjectId(id)
        const mediaMeta = await MediaMeta.findOne({ _id: objId }).lean().exec()
        
        if (!mediaMeta) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Media metadata not found')
        }
    
        // 3) Drop the version key
        delete mediaMeta.__v
    
        // 4) Format & enhance
        const formatted  = formatApiResult(mediaMeta)
        const [enhanced] = await this.enhanceWithFileUrls([formatted])
        return enhanced
    }
    
    
    /**
   * Enhance media metadata with file URLs
   * @param {Array} mediaMetadata - Array of media metadata objects
   * @returns {Promise<Array>} - Enhanced media metadata with URLs
   */
    async enhanceWithFileUrls(mediaMetadata) {
        try {
            // Extract all thumbnailIds and mediaFileIds
            const thumbnailIds = mediaMetadata.map((item) => item.thumbnailId);
            const mediaFileIds = mediaMetadata.map((item) => item.mediaFileId);

            // Remove file extensions from IDs for matching with fileId in the database
            const thumbnailIdsWithoutExt = thumbnailIds.map((id) => {
                // Handle both formats: "vid-1743733224619_thumb.jpg" and "thumb_vid-1743734282681_thumb"
                if (id.includes("_thumb")) {
                    // If it's a thumbnail, it might be in the format "thumb_vid-1743734282681_thumb"
                    return id.replace(/\.(jpg|jpeg|png)$/, "");
                }
                // For regular files, just remove the extension
                return id.split(".")[0];
            });

            const mediaFileIdsWithoutExt = mediaFileIds.map((id) => {
                // For media files, just remove the extension
                return id.split(".")[0];
            });

            // Fetch all files in one query
            const files = await File.find({
                $or: [
                    {
                        fileId: {
                            $in: [...thumbnailIdsWithoutExt, ...mediaFileIdsWithoutExt],
                        },
                    },
                    { blobName: { $in: [...thumbnailIds, ...mediaFileIds] } },
                ],
            });

            // Create a map for quick lookup
            const fileMap = {};
            files.forEach((file) => {
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
            return mediaMetadata.map((item) => {
                const enhancedItem = item.toObject ? item.toObject() : { ...item };

                // Try to find the URL using the exact ID first
                let thumbnailUrl = fileMap[item.thumbnailId];
                let mediaFileUrl = fileMap[item.mediaFileId];

                // If not found, try to find by ID without extension
                if (!thumbnailUrl) {
                    const thumbnailIdWithoutExt = item.thumbnailId.includes("_thumb")
                        ? item.thumbnailId.replace(/\.(jpg|jpeg|png)$/, "")
                        : item.thumbnailId.split(".")[0];
                    thumbnailUrl = fileMap[thumbnailIdWithoutExt];
                }

                if (!mediaFileUrl) {
                    const mediaFileIdWithoutExt = item.mediaFileId.split(".")[0];
                    mediaFileUrl = fileMap[mediaFileIdWithoutExt];
                }

                // If still not found, try to find by partial match
                if (!thumbnailUrl) {
                    const thumbnailFile = files.find(
                        (f) =>
                            (f.fileId && f.fileId.includes(item.thumbnailId.split(".")[0])) ||
              (f.blobName && f.blobName.includes(item.thumbnailId))
                    );
                    if (thumbnailFile) thumbnailUrl = thumbnailFile.url;
                }

                if (!mediaFileUrl) {
                    const mediaFile = files.find(
                        (f) =>
                            (f.fileId && f.fileId.includes(item.mediaFileId.split(".")[0])) ||
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

    /**
   * Update media metadata
   * @param {string} id - Media metadata ID
   * @param {Object} updateBody - Update body
   * @returns {Promise<Object>} - Updated media metadata
   */
    async updateMediaMetadata(id, updateBody) {
        try {
            const mediaMeta = await MediaMeta.findById(id);
            if (!mediaMeta) {
                throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
            }

            // Update the document
            Object.assign(mediaMeta, updateBody);
            await mediaMeta.save();

            // Convert to plain object and remove mongoose internals
            const plainObject = mediaMeta.toObject();
            delete plainObject.__v;
            delete plainObject.$__;
            delete plainObject.$isNew;
            delete plainObject._doc;

            // Format and enhance with URLs
            const formattedResult = formatApiResult(plainObject);
            const enhancedResult = await this.enhanceWithFileUrls([formattedResult]);

            return enhancedResult[0];
        } catch (error) {
            throw error;
        }
    }

    /**
   * Delete media metadata (soft delete)
   * @param {string} id - Media metadata ID
   * @returns {Promise<Object>} - Deleted media metadata
   */
    async deleteMediaMetadata(id) {
        try {
            const mediaMeta = await MediaMeta.findById(id);
            if (!mediaMeta) {
                throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
            }

            // Soft delete
            mediaMeta.isDeleted = true;
            mediaMeta.deletedAt = new Date();
            await mediaMeta.save();

            // Convert to plain object and remove mongoose internals
            const plainObject = mediaMeta.toObject();
            delete plainObject.__v;
            delete plainObject.$__;
            delete plainObject.$isNew;
            delete plainObject._doc;

            // Format and enhance with URLs
            const formattedResult = formatApiResult(plainObject);
            const enhancedResult = await this.enhanceWithFileUrls([formattedResult]);

            return enhancedResult[0];
        } catch (error) {
            throw error;
        }
    }

    /**
   * Restore soft-deleted media metadata
   * @param {string} id - Media metadata ID
   * @returns {Promise<Object>} - Restored media metadata
   */
    async restoreMediaMetadata(id) {
        try {
            const mediaMeta = await MediaMeta.findById(id);
            if (!mediaMeta) {
                throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
            }

            // Restore
            mediaMeta.isDeleted = false;
            mediaMeta.deletedAt = undefined;
            await mediaMeta.save();

            // Convert to plain object and remove mongoose internals
            const plainObject = mediaMeta.toObject();
            delete plainObject.__v;
            delete plainObject.$__;
            delete plainObject.$isNew;
            delete plainObject._doc;

            // Format and enhance with URLs
            const formattedResult = formatApiResult(plainObject);
            const enhancedResult = await this.enhanceWithFileUrls([formattedResult]);

            return enhancedResult[0];
        } catch (error) {
            throw error;
        }
    }

    /**
   * Increment view count for a video
   * @param {string} id - Media metadata ID
   * @returns {Promise<Object>} - Updated view count
   */
    async incrementViewCount(id) {
        try {
            const mediaMeta = await MediaMeta.findByIdAndUpdate(
                id,
                { $inc: { views: 1 } }, // Increment views by 1
                { new: true }
            );

            if (!mediaMeta) {
                throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
            }

            return { views: mediaMeta.views };
        } catch (error) {
            throw error;
        }
    }

    async approveMedia(id, adminId) {
        const mediaMeta = await MediaMeta.findById(id);
        if (!mediaMeta) {
            throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
        }
        if (mediaMeta.status === "approved") {
            throw new ApiError(httpStatus.BAD_REQUEST, "Media is already approved");
        }
        mediaMeta.status = "approved";
        mediaMeta.reviewedBy = adminId;
        mediaMeta.reviewedAt = new Date();
        await mediaMeta.save();

        // Notify user about content approval
        socketService.notifyContentStatus(
            mediaMeta.userId,
            id,
            "approved",
            mediaMeta
        );

        return mediaMeta;
    }

    async rejectMedia(id, adminId, rejectionReason) {
        const mediaMeta = await MediaMeta.findById(id);
        if (!mediaMeta) {
            throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
        }
        if (mediaMeta.status === "rejected") {
            throw new ApiError(httpStatus.BAD_REQUEST, "Media is already rejected");
        }
        mediaMeta.status = "rejected";
        mediaMeta.reviewedBy = adminId;
        mediaMeta.reviewedAt = new Date();
        mediaMeta.rejectionReason = rejectionReason;
        await mediaMeta.save();

        // Notify user about content rejection
        socketService.notifyContentStatus(
            mediaMeta.userId,
            id,
            "rejected",
            mediaMeta
        );

        return mediaMeta;
    }

    async getPendingMedia(filter = {}, options = {}) {
        const pendingFilter = { ...filter, status: "pending", isDeleted: false };
        return this.getMediaMetadata(pendingFilter, options);
    }

    async getApprovedMedia(filter = {}, options = {}) {
        const approvedFilter = { ...filter, status: "approved", isDeleted: false };
        return this.getMediaMetadata(approvedFilter, options);
    }

    async getRejectedMedia(filter = {}, options = {}) {
        const rejectedFilter = { ...filter, status: "rejected", isDeleted: false };
        return this.getMediaMetadata(rejectedFilter, options);
    }
}

module.exports = new MediaMetaService();

const MediaMeta = require("../models/mediaMeta.model");
const File = require("../models/file.model");
const Category = require("../models/category.model");
const { formatApiResult } = require("../utils/formatApiResult.util");
const { ApiError } = require("../features/error");
const httpStatus = require("http-status");
const socketService = require("./socket.service");
const eventBus = require("./eventBus.service");
const Video = require("../models/video.model");
const Reel = require("../models/reel.model");
const logger = require("../features/logger");
const utils = require("../utils");
const { fetchVideoDataByGuid } = require("../utils/bunny.utils");
const { createVideoMetadata, updateVideoMetadata, getVideoMetadata } = require("./videoMetaData.service");
const { startMediaProcessing } = require("../utils/mediaProcessing");

class MediaMetaService {
    // async createMediaMetaInfo(metaInfo, isAdmin = false) {
    //     try {
    //         const defaultMetaInfo = {
    //             ...metaInfo,
    //             status: isAdmin ? 'approved' : 'pending',
    //             reviewedBy: isAdmin ? metaInfo.userId : undefined,
    //             reviewedAt: isAdmin ? new Date() : undefined
    //         };

    //         let newFiles = [];
    //         if (metaInfo.mediaFileUrl) {
    //             const fileId = metaInfo.mediaFileId;
    //             const filesURLChunk = metaInfo.mediaFileUrl.split('/');
    //             const fileName = filesURLChunk[filesURLChunk.length - 1];
    //             newFiles.push({
    //                 fileId: fileId,
    //                 blobName: fileName,
    //                 url: metaInfo.mediaFileUrl,
    //                 mimeType: metaInfo.mediaFileMimeType || 'videos/mp4',
    //                 size: metaInfo.mediaFileSize || 0,
    //                 visibility: 'public',
    //                 originalName: fileName,
    //                 containerName: 'videos',
    //                 tags: metaInfo.mediaFileTags || []
    //             });
    //         }
    //         if (metaInfo.thumbnailUrl) {
    //             const thumbId = new Date().getTime().toString() + '_thumb';
    //             const thumbFilesURLChunk = metaInfo.thumbnailUrl.split('/');
    //             const thumbFileName = thumbFilesURLChunk[thumbFilesURLChunk.length - 1];
    //             newFiles.push({
    //                 fileId: thumbId,
    //                 blobName: thumbFileName,
    //                 url: metaInfo.thumbnailUrl,
    //                 mimeType: metaInfo.thumbnailMimeType || 'image/jpeg',
    //                 size: metaInfo.thumbnailSize || 0,
    //                 visibility: 'public',
    //                 originalName: thumbFileName,
    //                 containerName: 'thumbnails',
    //                 tags: metaInfo.thumbnailTags || []
    //             });
    //         }
    //         const docs = await Promise.all(
    //             newFiles.map(file => File.create(file))
    //         );
    //         docs.forEach(doc => {
    //             const docObject = doc.toObject();
    //             if (doc.containerName === 'videos') {
    //                 defaultMetaInfo.mediaFileId = docObject.fileId;
    //             } else if (doc.containerName === 'thumbnails') {
    //                 defaultMetaInfo.thumbnailId = docObject.fileId;
    //             }
    //         });
    //         console.log("🚀 ~ MediaMetaService ~ createMediaMetaInfo ~ defaultMetaInfo:", defaultMetaInfo)

    //         const mediaMeta = await MediaMeta.create(defaultMetaInfo);

    //         // Create corresponding content based on mediaType
    //         let content;
    //         if (metaInfo.mediaType === 'video') {
    //             content = await Video.create({
    //                 _id: utils.uuid('v-'),
    //                 title: metaInfo.title,
    //                 description: metaInfo.description,
    //                 author: metaInfo.userId,
    //                 category: metaInfo.category,
    //                 status: 'published',
    //                 type: 'video',
    //                 videoSpecific: {
    //                     mediaMetaId: mediaMeta._id,
    //                     duration: metaInfo.metadata?.duration || '00:00:00'
    //                 }
    //             });
    //         } else if (metaInfo.mediaType === 'reel') {
    //             content = await Reel.create({
    //                 _id: utils.uuid('r-'),
    //                 title: metaInfo.title,
    //                 description: metaInfo.description,
    //                 author: metaInfo.userId,
    //                 category: metaInfo.category,
    //                 status: 'published',
    //                 type: 'reel',
    //                 reelSpecific: {
    //                     description: metaInfo.description,
    //                     duration: metaInfo.metadata?.duration || '00:00:00',
    //                     mediaMetaId: mediaMeta._id
    //                 }
    //             });
    //         }

    //         // Enhance with category details
    //         const enhanced = await this.enhanceWithCategoryDetails([mediaMeta.toObject()]);

    //         if (!isAdmin) {
    //             // Notify admins about new media upload
    //             socketService.notifyMediaUpload(mediaMeta);

    //             // Notify user about upload status
    //             socketService.notifyMediaStatus(
    //                 mediaMeta.userId,
    //                 mediaMeta._id,
    //                 'pending',
    //                 {
    //                     title: mediaMeta.title,
    //                     type: mediaMeta.type,
    //                     message: 'Your media has been uploaded and is pending approval'
    //                 }
    //             );
    //         }

    //         return {
    //             ...enhanced[0],
    //             content
    //         };
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    /**
 * Inserts a stub record, then kicks off background processing.
 *
 * @param {Object} metaInfo
 * @param {string} metaInfo.mediaFileId
 * @param {string} metaInfo.title
 * @param {string} [metaInfo.description]
 * @param {string} [metaInfo.category]
 * @param {string} metaInfo.mediaType
 */
    async  createMediaMetaInfo(metaInfo) {
        // 1) immediately create a “processing” stub
        const created = await createVideoMetadata({
            guid:             metaInfo.mediaFileId,
            title:            metaInfo.title,
            description:      metaInfo.description || '',
            category:         metaInfo.category  || 'uncategorized',
            mediaType:        metaInfo.mediaType,
            processingStatus: 'processing',
            errorMessage:     null,
        });

        // 2) fire‑and‑forget the polling + update
        startMediaProcessing({
            recordId: created._id,
            fetchStatus: () => fetchVideoDataByGuid(metaInfo.mediaFileId),
            buildUpdatePayload: (data) => {
                const video = data.video;
                return {
                    libraryId:            video.videoLibraryId,
                    videoUrl:             data.videoPlaylistUrl,
                    previewUrl:           data.previewUrl,
                    thumbnailUrl:         data.thumbnailUrl,
                    lengthSec:            Number((video.length / video.framerate).toFixed(2)),
                    framerate:            video.framerate,
                    rotation:             video.rotation,
                    width:                video.width,
                    height:               video.height,
                    availableResolutions: video.availableResolutions ? video.availableResolutions.split(',') : [],
                    storageSizeBytes:     video.storageSize,
                    outputCodecs:         video.outputCodecs.split(','),
                    encodeProgress:       video.encodeProgress,
                    dateUploaded:         new Date(video.dateUploaded),
                };
            },
            updateRecord: updateVideoMetadata,
            intervalMs:   10000,  // every 10s
            maxAttempts:  240,   // up to 10 minutes
        });

        // 3) return the stub immediately
        return created;
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
                // sortBy = "createdAt:desc",
                category,
                type,
                ...otherOptions
            } = options;

            // 2) Build a clean filter object—strip out any stray page/limit/sortBy:
            const filter = { ...rawFilter };
            delete filter.page;
            delete filter.limit;
            delete filter.sortBy;
            delete filter.category;
            delete filter.type;

            // 3) Default isDeleted to false, if not provided:
            // if (filter.isDeleted === undefined) {
            //     filter.isDeleted = false;
            // }

            if (type === "video") {
                filter.mediaType = "video";
            } else if (type === "reel") {
                filter.mediaType = "reel";
            }

            // 4) Apply category logic:
            if (category && category !== "all") {
                filter.category = category;
            }

            // console.log("→ final filter:", filter);
            // console.log("→ query options:", { page, limit, sortBy, ...otherOptions });

            // 5) Call your paginate plugin
            // const result = await MediaMeta.paginate(filter, {
            //     page,
            //     limit,
            //     sortBy,
            //     lean: true,
            //     ...otherOptions,
            // });

            const result = await getVideoMetadata(filter, {
                page,
                limit,
                lean: true,
                ...otherOptions,
            })

            // 6) (optional) strip mongoose internals & enhance
            if (Array.isArray(result.results) && result.results.length) {
                const plain = result.results.map((doc) =>
                    doc.toObject ? doc.toObject() : doc
                );
                result.results = formatApiResult(plain);
                // result.results = await this.enhanceWithFileUrls(result?.results);
                result.results = await this.enhanceWithCategoryDetails(result?.results);

                // Merge with video/reel data based on type
                //     if (type === "video") {
                //         const videoIds = result.results.map((item) => item._id);
                //         const videos = await Video.find({
                //             "videoSpecific.mediaMetaId": { $in: videoIds },
                //         })
                //             .select("videoSpecific.duration views")
                //             .lean();

                //         const videoMap = new Map(
                //             videos.map((v) => [v.videoSpecific.mediaMetaId, v])
                //         );
                //         // console.log("🚀 ~ MediaMetaService ~ getMediaMetadata ~ videoMap:", videoMap);
                //         result.results = result.results.map((item) => ({
                //             ...item,
                //             duration:
                //   videoMap.get(item._id)?.videoSpecific?.duration || "00:00:00",
                //             totalViews:
                //   (item.views || 0) + (videoMap.get(item._id)?.views || 0),
                //         }));
                //     } else if (type === "reel") {
                //         const reelIds = result.results.map((item) => item._id);
                //         const reels = await Reel.find({
                //             "reelSpecific.mediaMetaId": { $in: reelIds },
                //         })
                //             .select("reelSpecific.duration views")
                //             .lean();

            //         const reelMap = new Map(
            //             reels.map((r) => [r.reelSpecific.mediaMetaId, r])
            //         );
            //         result.results = result.results.map((item) => ({
            //             ...item,
            //             duration:
            //   reelMap.get(item._id)?.reelSpecific?.duration || "00:00:00",
            //             totalViews: (item.views || 0) + (reelMap.get(item._id)?.views || 0),
            //         }));
            //     }
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
        const mediaMeta = await MediaMeta.findOne({ _id: id }).lean().exec();

        if (!mediaMeta) {
            throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
        }

        delete mediaMeta.__v;

        const formatted = formatApiResult(mediaMeta);
        const [enhanced] = await this.enhanceWithFileUrls([formatted]);
        const [withCategory] = await this.enhanceWithCategoryDetails([enhanced]);
        return withCategory;
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
            console.log(
                "🚀 ~ MediaMetaService ~ enhanceWithFileUrls ~ thumbnailIds:",
                thumbnailIds
            );
            const mediaFileIds = mediaMetadata.map((item) => item.mediaFileId);
            console.log(
                "🚀 ~ MediaMetaService ~ enhanceWithFileUrls ~ mediaFileIds:",
                mediaFileIds
            );

            // Remove file extensions from IDs for matching with fileId in the database
            const thumbnailIdsWithoutExt = thumbnailIds.map((id) => {
                return id?.split(".")[0];
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
                    const thumbnailIdWithoutExt = item?.thumbnailId?.includes("_thumb")
                        ? item?.thumbnailId?.replace(/\.(jpg|jpeg|png)$/, "")
                        : item.thumbnailId?.split(".")[0];
                    thumbnailUrl = fileMap[thumbnailIdWithoutExt];
                }

                if (!mediaFileUrl) {
                    const mediaFileIdWithoutExt = item?.mediaFileId?.split(".")[0];
                    mediaFileUrl = fileMap[mediaFileIdWithoutExt];
                }

                // If still not found, try to find by partial match
                if (!thumbnailUrl) {
                    const thumbnailFile = files?.find(
                        (f) =>
                            (f?.fileId &&
                f?.fileId?.includes(item?.thumbnailId?.split(".")[0])) ||
              (f.blobName && f.blobName.includes(item?.thumbnailId))
                    );
                    if (thumbnailFile) thumbnailUrl = thumbnailFile.url;
                }

                if (!mediaFileUrl) {
                    const mediaFile = files.find(
                        (f) =>
                            (f.fileId &&
                f.fileId.includes(item?.mediaFileId?.split(".")[0])) ||
              (f.blobName && f.blobName.includes(item?.mediaFileId))
                    );
                    if (mediaFile) mediaFileUrl = mediaFile?.url;
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
            // const mediaMeta = await MediaMeta.findOne({ _id: id });
            // if (!mediaMeta) {
            //     throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
            // }

            // Object.assign(mediaMeta, updateBody);
            // await mediaMeta.save();

            // const plainObject = mediaMeta.toObject();
            // delete plainObject.__v;
            // delete plainObject.$__;
            // delete plainObject.$isNew;
            // delete plainObject._doc;

            const updatedMedia = await updateVideoMetadata(id, updateBody);

            const plainObject = updatedMedia.toObject();
            delete plainObject.__v;
            delete plainObject.$__;
            delete plainObject.$isNew;
            delete plainObject._doc;

            const formattedResult = formatApiResult(plainObject);
            // const enhancedResult = await this.enhanceWithFileUrls([formattedResult]);
            const withCategory = await this.enhanceWithCategoryDetails(
                [formattedResult]
            );
            console.log("🚀 ~ :478 ~ MediaMetaService ~ updateMediaMetadata ~ withCategory:", withCategory)

            return withCategory[0];
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
            const mediaMeta = await MediaMeta.findOne({ _id: id });
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
            const mediaMeta = await MediaMeta.findOne({ _id: id });
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
        const mediaMeta = await MediaMeta.findOne({ _id: id });
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
        socketService.notifyMediaStatus(
            mediaMeta.userId,
            mediaMeta._id,
            "approved",
            {
                title: mediaMeta.title,
                type: mediaMeta.type,
                message: "Your media has been approved",
            }
        );

        // Publish event to event bus for advanced notification processing
        await eventBus.publish(
            "content.approved",
            {
                contentId: mediaMeta._id.toString(),
                contentTitle: mediaMeta.title,
                contentType: mediaMeta.type,
                sender: adminId,
                thumbnailUrl: mediaMeta.thumbnailUrl,
                userId: mediaMeta.userId,
                status: "approved",
            },
            {
                priority: "high",
                targetUsers: [mediaMeta.userId],
                publisher: "media-service",
            }
        );

        return mediaMeta;
    }

    async rejectMedia(id, adminId, rejectionReason) {
        const mediaMeta = await MediaMeta.findOne({ _id: id });
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
        socketService.notifyMediaStatus(
            mediaMeta.userId,
            mediaMeta._id,
            "rejected",
            {
                title: mediaMeta.title,
                type: mediaMeta.type,
                message: `Your media has been rejected${
                    rejectionReason ? `: ${rejectionReason}` : ""
                }`,
            }
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

    async enhanceWithCategoryDetails(mediaMetadata) {
        try {
            // Get all unique category names and convert to ObjectIds
            const categoryIds = [
                ...new Set(mediaMetadata.map((item) => item?.category)),
            ]
            //     .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
            //     .map((id) => new mongoose.Types.ObjectId(id));
            // console.log("🚀 ~ :677 ~ MediaMetaService ~ enhanceWithCategoryDetails ~ categoryIds:", categoryIds)

            if (categoryIds.length === 0) {
                return mediaMetadata;
            }

            // Fetch all categories in one query
            const categories = await Category.find({
                _id: { $in: categoryIds },
            }).lean();

            // Create a map for quick lookup
            const categoryMap = {};
            categories.forEach((category) => {
                categoryMap[category._id.toString()] = {
                    _id: category._id,
                    name: category.name,
                    type: category.type,
                    parentId: category.parentId,
                };
            });

            // Enhance each media metadata with category details
            return mediaMetadata.map((item) => {
                const enhancedItem = { ...item };
                if (item.category && categoryMap[item.category]) {
                    enhancedItem.categoryDetails = categoryMap[item.category];
                }
                return enhancedItem;
            });
        } catch (error) {
            console.error("Error enhancing with category details:", error);
            return mediaMetadata;
        }
    }

    async createMediaMeta(mediaMetaBody) {
        try {
            // Create MediaMeta record
            const mediaMeta = await MediaMeta.create({
                ...mediaMetaBody,
                _id: utils.uuid("me-"),
            });

            // Create corresponding content based on mediaType
            let content;
            if (mediaMetaBody.mediaType === "video") {
                content = await Video.create({
                    _id: utils.uuid("v-"),
                    title: mediaMetaBody.title,
                    description: mediaMetaBody.description,
                    author: mediaMetaBody.userId,
                    category: mediaMetaBody.category,
                    videoSpecific: {
                        mediaMetaId: mediaMeta._id,
                        duration: mediaMetaBody.metadata?.duration || "00:00:00",
                    },
                });
            } else if (mediaMetaBody.mediaType === "reel") {
                content = await Reel.create({
                    _id: utils.uuid("r-"),
                    title: mediaMetaBody.title,
                    description: mediaMetaBody.description,
                    author: mediaMetaBody.userId,
                    category: mediaMetaBody.category,
                    reelSpecific: {
                        description: mediaMetaBody.description,
                        duration: mediaMetaBody.metadata?.duration || "00:00:00",
                        mediaMetaId: mediaMeta._id,
                    },
                });
            }

            return {
                mediaMeta,
                content,
            };
        } catch (error) {
            logger.error("Error creating media metadata:", error);
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                "Error creating media metadata"
            );
        }
    }

    async getMediaMetaById(id) {
        const mediaMeta = await MediaMeta.findById(id);
        if (!mediaMeta) {
            throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
        }
        return mediaMeta;
    }

    async getAllMediaMeta(filter, options) {
        const mediaMeta = await MediaMeta.paginate(filter, options);
        return mediaMeta;
    }

    async updateMediaMetaById(id, updateBody) {
        const mediaMeta = await MediaMeta.findById(id);
        if (!mediaMeta) {
            throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
        }
        Object.assign(mediaMeta, updateBody);
        await mediaMeta.save();
        return mediaMeta;
    }

    async deleteMediaMetaById(id) {
        const mediaMeta = await MediaMeta.findById(id);
        if (!mediaMeta) {
            throw new ApiError(httpStatus.NOT_FOUND, "Media metadata not found");
        }
        await mediaMeta.remove();
        return mediaMeta;
    }
}

module.exports = new MediaMetaService();

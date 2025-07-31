const httpStatus = require('http-status');
const logger = require('../features/logger');
const { updateVideoMetadataByGuid } = require('../services/videoMetaData.service');
const { fetchVideoDataByGuid } = require('../utils/bunny.utils');

const webhookController = {
    /**
     * Handle BunnyCDN video webhook events.
     * Expects body to include VideoGuid and Status fields.
     */
    async bunnyCdn(req, res) {
        try {
            const payload = req.body || {};
            console.log("🚀 ~ :14 ~ bunnyCdn ~ payload:", JSON.stringify(payload));

            const guid = payload.VideoGuid || payload.videoGuid || payload.guid;
            if (!guid) {
                logger.warn('BunnyCDN webhook missing guid');
                return res.status(httpStatus.BAD_REQUEST).json({ message: 'Missing guid' });
            }

            const status = payload.Status ?? payload.status;

            let update = {};

            // If status >= 3, fetch full video metadata
            if (status >= 3) {
                try {
                    const metadata = await fetchVideoDataByGuid(guid);
                    const video = metadata.video;
                    // console.log("🚀 ~ :30 ~ bunnyCdn ~ metadata:", metadata);
                    update = {
                        libraryId: video.videoLibraryId,
                        videoUrl: metadata.videoPlaylistUrl,
                        previewUrl: metadata.previewUrl,
                        thumbnailUrl: metadata.thumbnailUrl,
                        encodeProgress: video.encodeProgress,
                        width: video.width,
                        height: video.height,
                        framerate: video.frameRate,
                        rotation: video.rotation,
                        lengthSec: video.length,
                        availableResolutions: Array.isArray(video.availableResolutions) && video.availableResolutions.length
                            ? video.availableResolutions
                            : video.availableResolutions && String(video.availableResolutions).split(','),
                        storageSizeBytes: video.storageSize,
                        outputCodecs: Array.isArray(video.outputCodecs)
                            ? video.outputCodecs
                            : video.outputCodecs && String(video.outputCodecs).split(','),
                        dateUploaded: video.dateUploaded ? new Date(video.dateUploaded) : undefined,
                        processingStatus: 'done',
                    };
                } catch (fetchErr) {
                    logger.error(`Failed to fetch full video data for GUID ${guid}:`, fetchErr);
                    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to fetch full video data' });
                }
            } else {
                update.processingStatus = 'processing';
            }
            // console.log("🚀 ~ :52 ~ bunnyCdn ~ update:", update)

            const updated = await updateVideoMetadataByGuid(guid, update);
            if (!updated) {
                logger.warn(`Video metadata not found for guid ${guid}`);
                return res.status(httpStatus.NOT_FOUND).json({ message: 'not found' });
            }

            return res.status(httpStatus.OK).json({ success: true });
        } catch (err) {
            logger.error('Error handling BunnyCDN webhook:', err);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ success: false });
        }
    }

};

module.exports = { webhookController };
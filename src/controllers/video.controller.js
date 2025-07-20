const httpStatus = require('http-status');
const { responseHandler } = require('../features/error');
const videoService = require('../services/video.service');
const logger = require('../features/logger');

/**
 * Get all videos with pagination and filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
exports.getAllVideos = async (req, res, next) => {
    try {
        const { page, limit, category, sortBy, sortOrder, recommend, selectedMediaId } = req.query;
        
        // Parse and validate query parameters
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10,
            category: category || undefined,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc',
            recommend,
            selectedMediaId
        };

        // Validate page and limit
        if (options.page < 1) {
            options.page = 1;
        }
        if (options.limit < 1 || options.limit > 100) {
            options.limit = 10;
        }

        logger.info('Fetching videos with options:', options);

        // Get videos data
        const result = await videoService.getAllVideos(options);

        // Log success
        logger.info('Videos fetched successfully');

        // Send response
        responseHandler(res, httpStatus.OK, 'Videos retrieved successfully', {
            results: result.results || [],
            pagination: {
                page: options.page,
                limit: options.limit,
                totalPages: result.totalPages,
                totalResults: result.totalResults,
                hasMore: result.hasMore,
                skip: result.skip,
                limit: result.limit
            }
        });
    } catch (error) {
        logger.error('Error getting videos:', error);
        next(error);
    }
};

/**
 * Get video by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
exports.getVideoById = async (req, res, next) => {
    try {
        const { videoId } = req.params;

        logger.info('Fetching video by ID:', videoId);

        // Get video data
        const video = await videoService.getVideoById(videoId);

        // Log success
        logger.info('Video fetched successfully');

        // Send response
        responseHandler(res, httpStatus.OK, 'Video retrieved successfully', video);
    } catch (error) {
        logger.error('Error getting video:', error);
        next(error);
    }
}; 
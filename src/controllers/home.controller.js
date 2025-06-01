const httpStatus = require('http-status');
const { responseHandler } = require('../features/error');
const homeService = require('../services/home.service');
const logger = require('../features/logger');

/**
 * Get home feed with mixed content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Promise<void>}
 */
exports.getHomeFeed = async (req, res, next) => {
    try {
        const { page, limit, category, featured } = req.query;
        
        // Parse and validate query parameters
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10,
            category: category || undefined,
            featured: featured === 'true'
        };

        // Validate page and limit
        if (options.page < 1) {
            options.page = 1;
        }
        if (options.limit < 1 || options.limit > 100) {
            options.limit = 10;
        }

        logger.info('Fetching home feed with options:', options);

        // Get home feed data
        const feed = await homeService.getHomeFeed(options);

        // Log success
        logger.info('Home feed fetched successfully');

        // Send response
        responseHandler(res, httpStatus.OK, 'Home feed retrieved successfully', {
            featured: {
                blogs: feed.featured.blogs || [],
                videos: feed.featured.videos || [],
                reels: feed.featured.reels || []
            },
            trending: {
                blogs: feed.trending.blogs || [],
                videos: feed.trending.videos || [],
                reels: feed.trending.reels || []
            },
            latest: {
                blogs: feed.latest.blogs || [],
                videos: feed.latest.videos || [],
                reels: feed.latest.reels || []
            },
            pagination: feed.pagination
        });
    } catch (error) {
        logger.error('Error getting home feed:', error);
        next(error);
    }
}; 
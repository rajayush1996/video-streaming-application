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
        // const { category, featured,  } = req.body;
        
        // Parse and validate query parameters

        // Validate page and limit

        // logger.info('Fetching home feed with options:', options);

        // Get home feed data
        const homeResponse = await homeService.getHomeDetails(req.body);

        // Log success
        logger.info('Home feed fetched successfully');

        // Send response
        // responseHandler(res, httpStatus.OK, 'Home feed retrieved successfully', 
        //     homeResponse
        // );
        return homeResponse;
    } catch (error) {
        logger.error('Error getting home feed:', error);
        next(error);
    }
}; 


exports.getTrendingVideos = async (req, res, next) => {
    try {
        // type='all' for which type trending, category, mostly Viewed
        const { page = 1, limit = 10, category=null, type } = req.query;
        const filter = {
            page: Number(page),
            limit: Number(limit),
        }
        if(category) {
            filter.category = category
        }
        if(type === 'reels') {
            filter.mediaType = 'reel'
        } else if(type === 'videos'){
            filter.mediaType = 'video'
        }
        const trendingVideos = await homeService.getTrendingVideos(filter);
        responseHandler(res, httpStatus.OK, 'Trending videos retrieved successfully', trendingVideos);
    } catch (error) {
        logger.error('Error getting trending videos:', error);
        next(error);
    }
};

exports.getTrendingReels = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, category } = req.query;
        const trendingVideos = await homeService.getTrendingVideos({
            page: Number(page),
            limit: Number(limit),
            category,
        });
        responseHandler(res, httpStatus.OK, 'Trending videos retrieved successfully', trendingVideos);
    } catch (error) {
        logger.error('Error getting trending videos:', error);
        next(error);
    }
};
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
        const homeResponse = await homeService.getHomeFeed(req.body);

        // Log success
        logger.info('Home feed fetched successfully');

        // Send response
        responseHandler(res, httpStatus.OK, 'Home feed retrieved successfully', 
            homeResponse
        );
    } catch (error) {
        logger.error('Error getting home feed:', error);
        next(error);
    }
}; 
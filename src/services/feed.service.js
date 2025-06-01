const blogService = require('./blog.service');
const reelService = require('./reel.service');
const videoService = require('./video.service');
const logger = require('../features/logger');
const { ApiError } = require('../features/error');
const httpStatus = require('http-status');

/**
 * Generate a mixed feed of blogs, reels, and videos
 * @param {Object} options - Feed options
 * @returns {Promise<Array>}
 */
exports.generateFeed = async (options = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            types = ['blog', 'reel', 'video'],
            featured,
            category
        } = options;

        // Prepare common filter options
        const filterOptions = {
            page,
            limit,
            featured,
            includeDeleted: false
        };

        // Add category filter if provided
        const filter = category ? { category } : {};

        // Fetch content from each type
        const fetchPromises = [];
        
        if (types.includes('blog')) {
            fetchPromises.push(blogService.getAllBlogs(filter, filterOptions));
        }
        
        if (types.includes('reel')) {
            fetchPromises.push(reelService.getAllReels(filter, filterOptions));
        }
        
        if (types.includes('video')) {
            fetchPromises.push(videoService.getAllVideos(filter, filterOptions));
        }

        // Wait for all content to be fetched
        const results = await Promise.all(fetchPromises);

        // Merge and sort results
        const mergedResults = results.flatMap(result => result.results);
        mergedResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedResults = mergedResults.slice(startIndex, endIndex);

        return {
            results: paginatedResults,
            page,
            limit,
            totalResults: mergedResults.length,
            totalPages: Math.ceil(mergedResults.length / limit)
        };
    } catch (error) {
        logger.error('Error in generateFeed service:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error generating feed');
    }
};

/**
 * Get featured content
 * @param {Object} options - Options for featured content
 * @returns {Promise<Array>}
 */
exports.getFeaturedContent = async (options = {}) => {
    try {
        const {
            limit = 6,
            types = ['blog', 'reel', 'video']
        } = options;

        // Prepare filter options for featured content
        const filterOptions = {
            featured: true,
            limit: Math.ceil(limit / types.length), // Distribute limit across types
            includeDeleted: false
        };

        // Fetch featured content from each type
        const fetchPromises = [];
        
        if (types.includes('blog')) {
            fetchPromises.push(blogService.getAllBlogs({}, filterOptions));
        }
        
        if (types.includes('reel')) {
            fetchPromises.push(reelService.getAllReels({}, filterOptions));
        }
        
        if (types.includes('video')) {
            fetchPromises.push(videoService.getAllVideos({}, filterOptions));
        }

        // Wait for all content to be fetched
        const results = await Promise.all(fetchPromises);

        // Merge and sort results
        const mergedResults = results.flatMap(result => result.results);
        mergedResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return mergedResults.slice(0, limit);
    } catch (error) {
        logger.error('Error in getFeaturedContent service:', error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching featured content');
    }
}; 
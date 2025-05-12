const httpStatus = require('http-status');
const logger = require('../features/logger');
const creatorRequestService = require('../services/creatorRequest.service');
const { responseHandler } = require('../features/error');

/**
 * Create a new creator request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createRequest = async (req, res, next) => {
    try {
        const request = await creatorRequestService.createRequest({
            ...req.body,
            userId: req.user.id
        });
        responseHandler(res, httpStatus.CREATED, 'Creator request created successfully', request);
    } catch (error) {
        logger.error('Error in createRequest controller:', error);
        next(error);
    }
};

/**
 * Get all creator requests with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getRequests = async (req, res, next) => {
    try {
        const result = await creatorRequestService.getRequests(req.query);
        responseHandler(res, httpStatus.OK, 'Creator requests retrieved successfully', result);
    } catch (error) {
        logger.error('Error in getRequests controller:', error);
        next(error);
    }
};

/**
 * Get a creator request by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getRequestById = async (req, res, next) => {
    try {
        const request = await creatorRequestService.getRequestById(req.params.id);
        responseHandler(res, httpStatus.OK, 'Creator request retrieved successfully', request);
    } catch (error) {
        logger.error(`Error in getRequestById controller for ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Update creator request status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateRequestStatus = async (req, res, next) => {
    try {
        const request = await creatorRequestService.updateRequestStatus(req.params.id, {
            ...req.body,
            reviewedBy: req.user.id
        });
        responseHandler(res, httpStatus.OK, 'Creator request status updated successfully', request);
    } catch (error) {
        logger.error(`Error in updateRequestStatus controller for ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Get creator request by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getRequestByUserId = async (req, res, next) => {
    try {
        const request = await creatorRequestService.getRequestByUserId(req.user.id);
        responseHandler(res, httpStatus.OK, 'Creator request retrieved successfully', request);
    } catch (error) {
        logger.error(`Error in getRequestByUserId controller for user ID ${req.user.id}:`, error);
        next(error);
    }
};

module.exports = {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus,
    getRequestByUserId
}; 
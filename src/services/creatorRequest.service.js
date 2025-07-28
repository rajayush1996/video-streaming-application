const httpStatus = require('http-status');
const CreatorRequest = require('../models/creatorRequest.model');
const UserCredentials = require('../models/userCredentials.model');
const { ApiError } = require('../features/error');
const logger = require('../features/logger');
const socketService = require('./socket.service');

class CreatorRequestService {
    /**
     * Create a new creator request
     * @param {Object} requestBody
     * @returns {Promise<Object>}
     */
    async createRequest(requestBody) {
        try {
            // Check if user already has a pending request
            const existingRequest = await CreatorRequest.findOne({
                userId: requestBody?.userId,
                status: 'pending',
            });

            if (existingRequest) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'You already have a pending creator request');
            }

            // Check if user is already a creator
            const user = await UserCredentials.findById(requestBody.userId);
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }
            if (user.role === 'creator') {
                throw new ApiError(httpStatus.BAD_REQUEST, 'You are already a creator');
            }

            const request = await CreatorRequest.create(requestBody);
            
            // Notify admins about new creator request
            socketService.notifyNewCreatorRequest(request);
            
            // Update pending requests count for admins
            const pendingCount = await CreatorRequest.countDocuments({ status: 'pending' });
            socketService.notifyPendingCreatorRequestsCount(pendingCount);

            return request;
        } catch (error) {
            logger.error('Error creating creator request:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating creator request');
        }
    }

    /**
     * Get all creator requests with pagination
     * @param {Object} filter - Mongo filter
     * @param {Object} options - Query options
     * @returns {Promise<Object>}
     */
    async getRequests(filter, options) {
        console.log("🚀 ~ :61 ~ CreatorRequestService ~ getRequests ~ filter:", filter)
        try {
            const requests = await CreatorRequest.paginate(filter, 
                options,
                // {
                // populate: {
                //     path: 'userId',
                //     select: 'username email'
                // }
            );
            return requests;
        } catch (error) {
            logger.error('Error fetching creator requests:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching creator requests');
        }
    }

    /**
     * Get a creator request by ID
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async getRequestById(id) {
        try {
            const request = await CreatorRequest.findById(id).populate('userId', 'username email');
            if (!request) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Creator request not found');
            }
            return request;
        } catch (error) {
            logger.error(`Error fetching creator request by ID ${id}:`, error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching creator request');
        }
    }

    /**
     * Update creator request status
     * @param {string} id
     * @param {Object} updateBody
     * @returns {Promise<Object>}
     */
    async updateRequestStatus(id, updateBody) {
        const session = await CreatorRequest.startSession();
        session.startTransaction();

        try {
            const request = await CreatorRequest.findById(id).session(session);
            if (!request) {
                await session.abortTransaction();
                throw new ApiError(httpStatus.NOT_FOUND, 'Creator request not found');
            }

            if (request.status !== 'pending') {
                await session.abortTransaction();
                throw new ApiError(httpStatus.BAD_REQUEST, 'Request has already been processed');
            }

            // Update request status
            request.status = updateBody.status;
            request.reviewedBy = updateBody.reviewedBy;
            request.reviewedAt = new Date();
            if (updateBody.status === 'rejected') {
                request.rejectionReason = updateBody.rejectionReason;
            }
            await request.save({ session });

            // If approved, update user role to creator
            if (updateBody.status === 'approved') {
                const user = await UserCredentials.findByIdAndUpdate(
                    request.userId,
                    { role: 'creator' },
                    { new: true, session }
                );
                if (!user) {
                    await session.abortTransaction();
                    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
                }
            }

            await session.commitTransaction();

            // Notify user about request status
            socketService.notifyCreatorRequestStatus(request.userId, updateBody.status, request);
            
            // Update pending requests count for admins
            const pendingCount = await CreatorRequest.countDocuments({ status: 'pending' });
            socketService.notifyPendingCreatorRequestsCount(pendingCount);

            return request;
        } catch (error) {
            await session.abortTransaction();
            logger.error(`Error updating creator request status for ID ${id}:`, error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating creator request status');
        } finally {
            session.endSession();
        }
    }

    /**
     * Get creator request by user ID
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async getRequestByUserId(userId) {
        try {
            const request = await CreatorRequest.findOne({ userId }).populate('userId', 'username email');
            if (!request) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Creator request not found');
            }
            return request;
        } catch (error) {
            logger.error(`Error fetching creator request for user ID ${userId}:`, error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching creator request');
        }
    }
}

module.exports = new CreatorRequestService(); 
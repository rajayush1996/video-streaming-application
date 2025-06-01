const httpStatus = require('http-status');
// Const {ApiError} = require('../features/error');
const UserService = require('./../services/user.service');
const { responseHandler } =require('../features/error');
const logger = require('../features/logger');

const createUser = async (req, res, next) => {
    try {
        const userData = req.body; // Assuming user data is sent in the request body
        const createdUser = await UserService.createUser(userData);
        res.status(httpStatus.CREATED).json(createdUser);
    } catch (error) {
        logger.error(error);
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await UserService.getUserById(userId);
        
        if (user) {
            // Create a safe user object without sensitive data            
            responseHandler(res, httpStatus.OK, 'User details retrieved successfully', user);
        } else {
            res.status(httpStatus.NOT_FOUND).json({ message: 'User details not found' });
        }
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    const userId = req.user.id;
    const userData = req.body; // Assuming updated user data is sent in the request body
    try {
        const updatedUser = await UserService.updateUser(userId, userData);
        if (updatedUser) {
            responseHandler(res, httpStatus.OK, '', updatedUser)
        } else {
            res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error(error);
        // Const err = new ApiError(httpStatus.NOT_FOUND, 'User details not found.');
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    const userId = req.params.id;
    try {
        const deletedUser = await UserService.deleteUser(userId);
        if (deletedUser) {
            res.json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const updateProfile = async (req, res, next) => {
    try {
        const { userId } = req.user;
        const profileData = req.body;

        const updatedUser = await UserService.updateUserProfile(userId, profileData);
        
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        logger.error('Error updating user profile:', error);
        next(error);
    }
};

/**
 * Get public user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const getPublicProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await UserService.getPublicProfile(userId);
        responseHandler(res, httpStatus.OK, 'Public profile retrieved successfully', user);
    } catch (error) {
        next(error);
    }
};

/**
 * Follow a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const followUser = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.id;
        const result = await UserService.followUser(followerId, followingId);
        responseHandler(res, httpStatus.OK, 'Successfully followed user', result);
    } catch (error) {
        next(error);
    }
};

/**
 * Unfollow a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const unfollowUser = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.id;
        const result = await UserService.unfollowUser(followerId, followingId);
        responseHandler(res, httpStatus.OK, 'Successfully unfollowed user', result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's followers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const getFollowers = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { page = 1, limit = 10 } = req.query;
        const followers = await UserService.getFollowers(userId, { page, limit });
        responseHandler(res, httpStatus.OK, 'Followers retrieved successfully', followers);
    } catch (error) {
        next(error);
    }
};

/**
 * Get users that the user is following
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const getFollowing = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const { page = 1, limit = 10 } = req.query;
        const following = await UserService.getFollowing(userId, { page, limit });
        responseHandler(res, httpStatus.OK, 'Following users retrieved successfully', following);
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's feed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const getUserFeed = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const feed = await UserService.getUserFeed(userId, { page, limit });
        responseHandler(res, httpStatus.OK, 'Feed retrieved successfully', feed);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    updateProfile,
    getPublicProfile,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getUserFeed
};

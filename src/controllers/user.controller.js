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

module.exports = {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    updateProfile
};

const httpStatus = require('http-status');
// Const {ApiError} = require('../features/error');
const UserService = require('./../services/user.service');

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
        const userId = req.params.id;
        const user = await UserService.getUserById(userId);
        if (user) {
            res.status(httpStatus.OK).json(user);
        } else {
            res.status(httpStatus.NOT_FOUND).json({message: 'User details not found'});
        }
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    const userId = req.params.id;
    const userData = req.body; // Assuming updated user data is sent in the request body
    try {
        const updatedUser = await UserService.updateUser(userId, userData);
        if (updatedUser) {
            res.json(updatedUser);
        } else {
            res.status(httpStatus.NOT_FOUND).json({message: 'User not found'});
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
            res.json({message: 'User deleted successfully'});
        } else {
            res.status(404).json({message: 'User not found'});
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
};

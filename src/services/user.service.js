/* eslint-disable no-useless-catch */
// Import the User model
const User = require('../models/user.model');
// const AuthService = require('../services/auth.service');
const utils = require('../utils/utils');
const httpStatus = require('http-status');
const { ApiError } = require('../features/error');
const logger = require('../features/logger');

class UserService {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<User>}
     */
    async createUser(userData) {
        try {
            const user = new User(userData);
            await user.save();
            return user;
        } catch (error) {
            logger.error('Error creating user:', error);
            if (error.code === 11000) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Username already exists');
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating user');
        }
    }

    /**
     * Get user by username
     * @param {string} username - Username
     * @returns {Promise<User>}
     */
    async getUserByUsername(username) {
        try {
            return await User.findOne({ username });
        } catch (error) {
            logger.error('Error fetching user by username:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user');
        }
    }

    // Retrieve a user by ID
    async getUserById(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }
            return user;
        } catch (error) {
            logger.error('Error fetching user:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user');
        }
    }

    async getUserByMobNumber(mobNumber, options = {}, projection = {}) {
        try {
            options.mobNumber = mobNumber;
            options.isActive = true;
            return await User.findOne(options).select(projection);
        } catch (error) {
            throw error;
        }
    }

    async getUserByEmail(email, options = {}, projection = {}) {
        try {
            options.email = email;
            options.isActive = true; // Assuming you only want to fetch active users
            return await User.findOne(options).select(projection);
        } catch (error) {
            throw error;
        } 
    }

    /**
     * Update user by ID
     * @param {string} userId - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<User>}
     */
    async updateUser(userId, updateData) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            );

            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            return user;
        } catch (error) {
            logger.error('Error updating user:', error);
            if (error instanceof ApiError) throw error;
            if (error.code === 11000) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Username already exists');
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating user');
        }
    }

    async updateByMobNumber(mobNumber, userData) {
        try {
            // Check if the document with mobNumber exists in the database
            const existingUser = await User.findOne({ mobNumber });

            // If an existing document is found, use its _id
            if (existingUser) {
                userData._id = existingUser._id;
            } else {
                // If no existing document is found, generate a new _id
                userData._id = await utils.uuid('u-');
            }

            const options = { new: true, upsert: true };
            const filter = { mobNumber };
            const update = {
                $set: userData,
            };

            // Use findOneAndUpdate to get the updated document
            const updatedUser = await User.findOneAndUpdate(filter, update, options);

            if (updatedUser) {
                return updatedUser;
            }

            throw new Error('Failed to update or upsert user data');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete user by ID
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        try {
            const user = await User.findByIdAndDelete(userId);
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }
        } catch (error) {
            logger.error('Error deleting user:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error deleting user');
        }
    }

    /**
     * Get all users with pagination
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>}
     */
    async getAllUsers(options) {
        try {
            const { page = 1, limit = 10, sortBy = '-createdAt' } = options;
            const result = await User.paginate({}, {
                page,
                limit,
                sort: sortBy
            });
            return result;
        } catch (error) {
            logger.error('Error fetching users:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching users');
        }
    }

    async getUserByVerificationToken(token) {
        return await User.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: new Date() } });
    }

    async updateUserProfile(userId, profileData) {
        try {
            const options = { 
                new: true, 
                select: "firstName lastName email role phoneNumber subscriptionType createdAt profileUrl isActive" 
            };
            return await User.findByIdAndUpdate(userId, profileData, options);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user by username or email
     * @param {string} identifier - Username or email
     * @returns {Promise<User>}
     */
    async getUserByIdentifier(identifier) {
        try {
            // Check if identifier is email (contains @)
            const isEmail = identifier.includes('@');
            
            if (isEmail) {
                return await User.findOne({ email: identifier });
            } else {
                return await User.findOne({ username: identifier });
            }
        } catch (error) {
            logger.error('Error fetching user by identifier:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user');
        }
    }

}

module.exports = new UserService();

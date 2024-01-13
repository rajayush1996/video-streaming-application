/* eslint-disable no-useless-catch */
// Import the User model
const User = require('../models/user.model');
const AuthService = require('../services/auth.service');
const utils = require('../utils/utils');
class UserService {
    // Create a new user
    async createUser(userData) {
        try {
            const user = new User(userData);
            await AuthService.sendOtpMessage(userData);
            return await user.save();
        } catch (error) {
            throw error;
        }
    }

    // Retrieve a user by ID
    async getUserById(userId) {
        try {
            return await User.findById(userId);
        } catch (error) {
            throw error;
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

    // Update user information
    async updateUser(userId, userData) {
        try {
            const options = {new: true, upsert: true};
            return await User.updateOne({_id: userId}, userData, options);
        } catch (error) {
            throw error;
        }
    }

    async updateByMobNumber(mobNumber, userData) {
        try {
            // Check if the document with mobNumber exists in the database
            const existingUser = await User.findOne({mobNumber});

            // If an existing document is found, use its _id
            if (existingUser) {
                userData._id = existingUser._id;
            } else {
                // If no existing document is found, generate a new _id
                userData._id = await utils.uuid('u-');
            }

            const options = {new: true, upsert: true};
            const filter = {mobNumber};
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

    // Delete a user by ID
    async deleteUser(userId) {
        try {
            return await User.findByIdAndDelete(userId);
        } catch (error) {
            throw error;
        }
    }

    // Retrieve a list of all users
    async getAllUsers() {
        try {
            return await User.find();
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserService();

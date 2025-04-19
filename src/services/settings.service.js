const Settings = require("../models/settings.model");
const { ApiError } = require('../features/error');
const httpStatus = require("http-status");
const logger = require("../features/logger");

/**
 * Get user settings
 * @param {string} userId - User ID
 * @returns {Promise<Settings>}
 */
exports.getUserSettings = async (userId) => {
    try {
        const settings = await Settings.findOne({ user: userId });
        if (!settings) {
            // Create default settings if not exists
            return await Settings.create({ user: userId });
        }
        return settings;
    } catch (error) {
        logger.error(`Error getting settings for user ${userId}:`, error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching settings");
    }
};

/**
 * Update user profile settings
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Settings>}
 */
exports.updateProfileSettings = async (userId, profileData) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { user: userId },
            { $set: { profile: profileData } },
            { new: true, upsert: true }
        );
        return settings;
    } catch (error) {
        logger.error(`Error updating profile settings for user ${userId}:`, error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating profile settings");
    }
};

/**
 * Update user categories
 * @param {string} userId - User ID
 * @param {Array<string>} categories - Categories to set
 * @returns {Promise<Settings>}
 */
exports.updateCategories = async (userId, categories) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { user: userId },
            { $set: { categories } },
            { new: true, upsert: true }
        );
        return settings;
    } catch (error) {
        logger.error(`Error updating categories for user ${userId}:`, error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating categories");
    }
};

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<Settings>}
 */
exports.updatePreferences = async (userId, preferences) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { user: userId },
            { $set: { preferences } },
            { new: true, upsert: true }
        );
        return settings;
    } catch (error) {
        logger.error(`Error updating preferences for user ${userId}:`, error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating preferences");
    }
}; 
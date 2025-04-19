const settingsService = require("../services/settings.service");
const httpStatus = require("http-status");
const logger = require("../features/logger");

/**
 * Get user settings
 * @route GET /api/v1/settings
 */
exports.getSettings = async (req, res, next) => {
    try {
        const settings = await settingsService.getUserSettings(req.user._id);
        return res.status(httpStatus.OK).json(settings);
    } catch (error) {
        logger.error("Error getting settings:", error);
        next(error);
    }
};

/**
 * Update profile settings
 * @route PUT /api/v1/settings/profile
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const { username, firstName, lastName, displayName } = req.body;
        const settings = await settingsService.updateProfileSettings(req.user._id, {
            username,
            firstName,
            lastName,
            displayName
        });
        return res.status(httpStatus.OK).json({
            message: "Profile updated successfully",
            settings
        });
    } catch (error) {
        logger.error("Error updating profile:", error);
        next(error);
    }
};

/**
 * Update categories
 * @route PUT /api/v1/settings/categories
 */
exports.updateCategories = async (req, res, next) => {
    try {
        const { categories } = req.body;
        const settings = await settingsService.updateCategories(req.user._id, categories);
        return res.status(httpStatus.OK).json({
            message: "Categories updated successfully",
            settings
        });
    } catch (error) {
        logger.error("Error updating categories:", error);
        next(error);
    }
};

/**
 * Update preferences
 * @route PUT /api/v1/settings/preferences
 */
exports.updatePreferences = async (req, res, next) => {
    try {
        const { emailNotifications, pushNotifications, theme } = req.body;
        const settings = await settingsService.updatePreferences(req.user._id, {
            emailNotifications,
            pushNotifications,
            theme
        });
        return res.status(httpStatus.OK).json({
            message: "Preferences updated successfully",
            settings
        });
    } catch (error) {
        logger.error("Error updating preferences:", error);
        next(error);
    }
}; 
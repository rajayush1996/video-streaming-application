const httpStatus = require('http-status');
const { ApiError } = require('../features/error');
const UserService = require('../services/user.service');
const UploadService = require('../services/upload.service');
const logger = require('../features/logger');

class ProfileController {
    /**
     * Upload user avatar
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async uploadAvatar(req, res, next) {
        try {
            if (!req.files || !req.files.avatar) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
            }

            const userId = req.user.id;
            const avatarFile = req.files.avatar;
            
            // Upload avatar using upload service
            const result = await UploadService.handleProfileImageUpload(avatarFile, 'avatar', userId);

            // Update user profile with new avatar URL
            const updatedUser = await UserService.updateUserProfile(userId, {
                avatar: result.url
            });

            res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: 'Avatar uploaded successfully',
                data: {
                    user: updatedUser,
                    file: result.file
                },
                success: true
            });
        } catch (error) {
            logger.error('Error uploading avatar:', error);
            next(error);
        }
    }

    /**
     * Upload user cover image
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async uploadCoverImage(req, res, next) {
        try {
            if (!req.files || !req.files.coverImage) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
            }

            const userId = req.user.id;
            const coverFile = req.files.coverImage;
            
            // Upload cover image using upload service
            const result = await UploadService.handleProfileImageUpload(coverFile, 'cover', userId);

            // Update user profile with new cover image URL
            const updatedUser = await UserService.updateUserProfile(userId, {
                coverImage: result.url
            });

            res.status(httpStatus.OK).json({
                code: httpStatus.OK,
                message: 'Cover image uploaded successfully',
                data: {
                    user: updatedUser,
                    file: result.file
                },
                success: true
            });
        } catch (error) {
            logger.error('Error uploading cover image:', error);
            next(error);
        }
    }
}

module.exports = new ProfileController(); 
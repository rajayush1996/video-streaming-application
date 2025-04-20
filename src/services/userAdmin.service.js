const User = require("../models/user.model");
const httpStatus = require("http-status");
const { ApiError } = require("../features/error");
const logger = require("../features/logger");

class UserAdminService {
    /**
     * Get users with pagination, filtering, and search
     * @param {Object} filter - Filter criteria (role, status, etc.)
     * @param {Object} options - Query options (pagination, sorting)
     * @param {string} searchQuery - Search query for name or email
     * @param {boolean} includeDeleted - Whether to include deleted users (default: false)
     * @returns {Promise<Object>} Paginated results
     */
    async getUsers(filter = {}, options = {}, searchQuery = "", includeDeleted = false) {
        try {
            // Default options
            const defaultOptions = {
                sortBy: "createdAt:desc",
                limit: 10,
                page: 1,
            };

            // Merge with provided options
            const queryOptions = { ...defaultOptions, ...options };

            // By default, exclude deleted users unless specifically requested
            if (!includeDeleted) {
                filter.deletedAt = null;
            }

            // Handle search query (search by name or email)
            if (searchQuery) {
                const searchRegex = new RegExp(searchQuery, "i");
                filter.$or = [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { username: searchRegex },
                    { "phoneNumber.number": searchRegex }
                ];
            }

            // Exclude password field from results
            queryOptions.select = '-password';

            // Use the paginate plugin
            let result = await User.paginate(filter, queryOptions);

            // Double-check to ensure passwords are removed from all results
            if (result.results) {
                // Map each result to remove password field
                result.results = result.results.map(user => {
                    const userObj = user.toObject ? user.toObject() : { ...user };
                    delete userObj.password;
                    return userObj;
                });
            }

            return result;
        } catch (error) {
            logger.error("Error getting users:", error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching users");
        }
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User object
     */
    async getUserById(userId) {
        try {
            const user = await User.findById(userId).select('-password');
            
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, "User not found");
            }

            return user;
        } catch (error) {
            logger.error(`Error getting user by ID ${userId}:`, error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching user");
        }
    }

    /**
     * Update user
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update (role, status, subscription)
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, updateData) {
        try {
            // Find the user first
            const user = await User.findById(userId);
            
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, "User not found");
            }

            // Validate role if it's being updated
            if (updateData.role && !['USER', 'ADMIN', 'CREATOR'].includes(updateData.role)) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid role specified");
            }

            // Add updatedAt timestamp
            updateData.updatedAt = new Date();

            // Update the user
            Object.assign(user, updateData);
            await user.save();

            // Return user without password
            const userObject = user.toObject();
            delete userObject.password;

            return userObject;
        } catch (error) {
            logger.error(`Error updating user ${userId}:`, error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating user");
        }
    }

    /**
     * Change user status (activate, deactivate, suspend)
     * @param {string} userId - User ID
     * @param {string} status - New status ('active', 'inactive', 'suspended')
     * @returns {Promise<Object>} Updated user
     */
    async changeUserStatus(userId, status) {
        try {
            // Map status string to isActive boolean
            let updateData = {};
            
            switch (status.toLowerCase()) {
            case 'active':
                updateData.isActive = true;
                break;
            case 'inactive':
            case 'suspended':
                updateData.isActive = false;
                break;
            default:
                throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status specified");
            }

            // Update the user
            const updatedUser = await this.updateUser(userId, updateData);
            
            // The password is already removed in updateUser method
            return updatedUser;
        } catch (error) {
            logger.error(`Error changing user status for ${userId}:`, error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error changing user status");
        }
    }

    /**
     * Delete user (soft delete)
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Deleted user
     */
    async deleteUser(userId) {
        try {
            // First find the user to check if they're an admin
            const user = await User.findById(userId);
            
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, "User not found");
            }

            // Prevent deletion of ADMIN users
            if (user.role === 'ADMIN') {
                throw new ApiError(
                    httpStatus.FORBIDDEN, 
                    "Admin users cannot be deleted"
                );
            }

            // Soft delete by deactivating user and marking as deleted
            user.isActive = false;
            user.deletedAt = new Date();
            await user.save();

            return { 
                message: "User deleted successfully", 
                userId,
                isActive: false,
                deletedAt: user.deletedAt
            };
        } catch (error) {
            logger.error(`Error deleting user ${userId}:`, error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting user");
        }
    }

    /**
     * Create new user (admin function)
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        try {
            // Create new user
            const user = await User.create(userData);
            
            // Return user without password
            const userObject = user.toObject();
            delete userObject.password;
            
            return userObject;
        } catch (error) {
            logger.error("Error creating user:", error);
            
            // Handle duplicate username
            if (error.code === 11000) {
                throw new ApiError(
                    httpStatus.CONFLICT, 
                    "Username already exists"
                );
            }
            
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error creating user");
        }
    }
}

module.exports = new UserAdminService(); 
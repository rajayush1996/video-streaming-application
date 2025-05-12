const UserCredentials = require("../models/userCredentials.model");
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

            // Build the aggregation pipeline
            const pipeline = [
                // Match stage for filtering
                {
                    $match: {
                        ...filter,
                        ...(includeDeleted ? {} : { deletedAt: null })
                    }
                },

                // Lookup user profile data
                {
                    $lookup: {
                        from: 'userprofiles',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'profile'
                    }
                },

                // Unwind the profile array
                {
                    $unwind: {
                        path: '$profile',
                        preserveNullAndEmptyArrays: true
                    }
                },

                // Handle search query
                ...(searchQuery ? [{
                    $match: {
                        $or: [
                            { username: { $regex: searchQuery, $options: 'i' } },
                            { email: { $regex: searchQuery, $options: 'i' } },
                            { 'profile.firstName': { $regex: searchQuery, $options: 'i' } },
                            { 'profile.lastName': { $regex: searchQuery, $options: 'i' } },
                            { 'profile.phoneNumber': { $regex: searchQuery, $options: 'i' } }
                        ]
                    }
                }] : []),

                // Project only the fields we want to return
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        role: 1,
                        status: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        lastLoginAt: 1,
                        'profile.firstName': 1,
                        'profile.lastName': 1,
                        'profile.phoneNumber': 1,
                        'profile.address': 1,
                        'profile.bio': 1,
                        'profile.avatar': 1,
                        'profile.socialLinks': 1,
                        'profile.preferences': 1,
                        'profile.displayName': 1,
                        'profile.coverImage': 1,
                    }
                },

                // Sort stage
                {
                    $sort: {
                        [queryOptions.sortBy.split(':')[0]]: 
                            queryOptions.sortBy.split(':')[1] === 'desc' ? -1 : 1
                    }
                }
            ];

            // Execute the aggregation with pagination
            const skip = (queryOptions.page - 1) * queryOptions.limit;
            const [results, total] = await Promise.all([
                UserCredentials.aggregate([
                    ...pipeline,
                    { $skip: skip },
                    { $limit: queryOptions.limit }
                ]),
                UserCredentials.aggregate([
                    ...pipeline,
                    { $count: 'total' }
                ])
            ]);

            // Format the results
            const formattedResults = results.map(user => ({
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                firstName: user.profile?.firstName,
                lastName: user.profile?.lastName,
                phoneNumber: user.profile?.phoneNumber,
                address: user.profile?.address,
                bio: user.profile?.bio,
                avatar: user.profile?.avatar,
                socialLinks: user.profile?.socialLinks,
                preferences: user.profile?.preferences,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt,
                name: user.profile?.displayName,
                coverImage: user.profile?.coverImage
            }));

            return {
                results: formattedResults,
                page: queryOptions.page,
                limit: queryOptions.limit,
                totalPages: Math.ceil((total[0]?.total || 0) / queryOptions.limit),
                totalResults: total[0]?.total || 0
            };
        } catch (error) {
            logger.error("Error getting users:", error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching users");
        }
    }

    /**
     * Get user by ID with combined data from UserCredentials and UserProfile
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Combined user data
     */
    async getUserById(userId) {
        try {
            const user = await UserCredentials.aggregate([
                // Match the user by ID
                { $match: { _id: userId } },
                
                // Lookup user profile data
                {
                    $lookup: {
                        from: 'userprofiles',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'profile'
                    }
                },
                
                // Unwind the profile array (since lookup returns an array)
                { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
                
                // Project only the fields we want to return
                {
                    $project: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        role: 1,
                        status: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        lastLoginAt: 1,
                        'profile.firstName': 1,
                        'profile.lastName': 1,
                        'profile.phoneNumber': 1,
                        'profile.address': 1,
                        'profile.bio': 1,
                        'profile.avatar': 1,
                        'profile.socialLinks': 1,
                        'profile.preferences': 1
                    }
                }
            ]);

            if (!user || user.length === 0) {
                throw new ApiError(httpStatus.NOT_FOUND, "User not found");
            }

            // Combine the data into a single object
            const userData = {
                ...user[0],
                profile: user[0].profile || {}
            };

            // Remove the nested profile object and flatten the structure
            const flattenedUser = {
                id: userData._id,
                username: userData.username,
                email: userData.email,
                role: userData.role,
                status: userData.status,
                firstName: userData.profile.firstName,
                lastName: userData.profile.lastName,
                phoneNumber: userData.profile.phoneNumber,
                address: userData.profile.address,
                bio: userData.profile.bio,
                avatar: userData.profile.avatar,
                socialLinks: userData.profile.socialLinks,
                preferences: userData.profile.preferences,
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
                lastLoginAt: userData.lastLoginAt
            };

            return flattenedUser;
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
            const user = await UserCredentials.findById(userId);
            
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
            // Map status string to status field
            let updateData = {};
            
            switch (status.toLowerCase()) {
            case 'active':
                updateData.status = 'active';
                break;
            case 'inactive':
                updateData.status = 'inactive';
                break;
            case 'suspended':
                updateData.status = 'suspended';
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
            const user = await UserCredentials.findById(userId);
            
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

            // Soft delete by updating status and adding deletedAt
            user.status = 'inactive';
            user.deletedAt = new Date();
            await user.save();

            return { 
                message: "User deleted successfully", 
                userId,
                status: user.status,
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
            const user = await UserCredentials.create(userData);
            
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
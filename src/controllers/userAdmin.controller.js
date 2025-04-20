const userAdminService = require("../services/userAdmin.service");
const httpStatus = require("http-status");
const logger = require("../features/logger");

/**
 * Get all users with pagination and filtering
 * @route GET /api/v1/admin/users
 */
exports.getUsers = async (req, res, next) => {
    try {
        // Extract query parameters
        const { page, limit, sortBy, role, isActive, search, includeDeleted } = req.query;
        
        // Build filter
        const filter = {};
        if (role) filter.role = role.toUpperCase();
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        
        // Build options
        const options = {};
        if (page) options.page = parseInt(page);
        if (limit) options.limit = parseInt(limit);
        if (sortBy) options.sortBy = sortBy;
        
        // Get users with pagination and search
        const result = await userAdminService.getUsers(
            filter, 
            options, 
            search, 
            includeDeleted === 'true'
        );
        
        return res.status(httpStatus.OK).json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error("Error in getUsers controller:", error);
        next(error);
    }
};

/**
 * Get user by ID
 * @route GET /api/v1/admin/users/:id
 */
exports.getUserById = async (req, res, next) => {
    try {
        const user = await userAdminService.getUserById(req.params.id);
        
        return res.status(httpStatus.OK).json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error(`Error in getUserById controller for ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Update user
 * @route PUT /api/v1/admin/users/:id
 */
exports.updateUser = async (req, res, next) => {
    try {
        const updateData = req.body;
        const user = await userAdminService.updateUser(req.params.id, updateData);
        
        return res.status(httpStatus.OK).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        logger.error(`Error in updateUser controller for ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Change user status (activate, deactivate, suspend)
 * @route PATCH /api/v1/admin/users/:id/status
 */
exports.changeUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Status is required"
            });
        }
        
        const user = await userAdminService.changeUserStatus(req.params.id, status);
        
        return res.status(httpStatus.OK).json({
            success: true,
            message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        logger.error(`Error in changeUserStatus controller for ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Delete user
 * @route DELETE /api/v1/admin/users/:id
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const result = await userAdminService.deleteUser(req.params.id);
        
        return res.status(httpStatus.OK).json({
            success: true,
            message: "User deleted successfully",
            data: result
        });
    } catch (error) {
        logger.error(`Error in deleteUser controller for ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * Create new user
 * @route POST /api/v1/admin/users
 */
exports.createUser = async (req, res, next) => {
    try {
        const userData = req.body;
        const user = await userAdminService.createUser(userData);
        
        return res.status(httpStatus.CREATED).json({
            success: true,
            message: "User created successfully",
            data: user
        });
    } catch (error) {
        logger.error("Error in createUser controller:", error);
        next(error);
    }
}; 
const userAdminService = require("../services/userAdmin.service");
const httpStatus = require("http-status");
const logger = require("../features/logger");
const { responseHandler } = require("../features/error");

/**
 * Get current admin user details
 * @route GET /api/v1/admin/users/me
 */
exports.getCurrentAdmin = async (req, res, next) => {
    try {
        const user = await userAdminService.getUserById(req.user.id);
        responseHandler(res, httpStatus.OK, 'Admin details retrieved successfully', user);
    } catch (error) {
        logger.error('Error in getCurrentAdmin controller:', error);
        next(error);
    }
};

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
        if (role) filter.role = role.toLowerCase();
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
        
        responseHandler(res, httpStatus.OK, 'Users retrieved successfully', result);
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
        responseHandler(res, httpStatus.OK, 'User retrieved successfully', user);
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
        responseHandler(res, httpStatus.OK, 'User updated successfully', user);
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
            return responseHandler(res, httpStatus.BAD_REQUEST, 'Status is required');
        }
        
        const user = await userAdminService.changeUserStatus(req.params.id, status);
        responseHandler(res, httpStatus.OK, `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`, user);
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
        responseHandler(res, httpStatus.OK, 'User deleted successfully', result);
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
        responseHandler(res, httpStatus.CREATED, 'User created successfully', user);
    } catch (error) {
        logger.error("Error in createUser controller:", error);
        next(error);
    }
}; 
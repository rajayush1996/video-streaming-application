const express = require('express');
const userAdminController = require('../../controllers/userAdmin.controller');
const auth = require('../../middlewares/auth.middleware');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth('admin'));

/**
 * @route GET /api/v1/admin/users/me
 * @desc Get current admin user details
 * @access Admin only
 */
router.get('/me', userAdminController.getCurrentAdmin);

/**
 * @route GET /api/v1/admin/users
 * @desc Get all users with pagination and filtering
 * @access Admin only
 */
router.get('/', userAdminController.getUsers);

/**
 * @route GET /api/v1/admin/users/:id
 * @desc Get user by ID
 * @access Admin only
 */
router.get('/:id', userAdminController.getUserById);

/**
 * @route PUT /api/v1/admin/users/:id
 * @desc Update user details
 * @access Admin only
 */
router.put('/:id', userAdminController.updateUser);

/**
 * @route PATCH /api/v1/admin/users/:id/status
 * @desc Change user status
 * @access Admin only
 */
router.patch('/:id/status', userAdminController.changeUserStatus);

/**
 * @route DELETE /api/v1/admin/users/:id
 * @desc Delete user
 * @access Admin only
 */
router.delete('/:id', userAdminController.deleteUser);

/**
 * @route POST /api/v1/admin/users
 * @desc Create new user
 * @access Admin only
 */
router.post('/', userAdminController.createUser);

module.exports = router; 
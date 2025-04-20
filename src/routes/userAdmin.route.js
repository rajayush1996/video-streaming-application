const express = require('express');
const userAdminController = require('../controllers/userAdmin.controller');
const authenticated = require('../middlewares/auth.middleware');
const adminOnly = require('../middlewares/admin.middleware'); // Assuming this middleware exists or will be created

const router = express.Router();

/**
 * @route GET /api/v1/admin/users
 * @desc Get all users with pagination and filtering
 * @access Admin only
 */
router.get('/', authenticated, adminOnly, userAdminController.getUsers);

/**
 * @route GET /api/v1/admin/users/:id
 * @desc Get user by ID
 * @access Admin only
 */
router.get('/:id', authenticated, adminOnly, userAdminController.getUserById);

/**
 * @route PUT /api/v1/admin/users/:id
 * @desc Update user details
 * @access Admin only
 */
router.put('/:id', authenticated, adminOnly, userAdminController.updateUser);

/**
 * @route PATCH /api/v1/admin/users/:id/status
 * @desc Change user status
 * @access Admin only
 */
router.patch('/:id/status', authenticated, adminOnly, userAdminController.changeUserStatus);

/**
 * @route DELETE /api/v1/admin/users/:id
 * @desc Delete user
 * @access Admin only
 */
router.delete('/:id', authenticated, adminOnly, userAdminController.deleteUser);

/**
 * @route POST /api/v1/admin/users
 * @desc Create new user
 * @access Admin only
 */
router.post('/', authenticated, adminOnly, userAdminController.createUser);

module.exports = router; 
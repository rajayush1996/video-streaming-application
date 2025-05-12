/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const userController = require("../../controllers/user.controller");
const auth = require("../../middlewares/auth.middleware");
const { validate } = require('../../middlewares/validation.middleware');
const { updateProfileSchema } = require('../../validations/user.validation');
const profileController = require('../../controllers/profile.controller');

/* GET users listing. */
// eslint-disable-next-line no-unused-vars
router.get('/me', auth('getUser'), userController.getUserById);
router.put('/me', auth('updateUser'), validate(updateProfileSchema), userController.updateUser);

/**
 * @swagger
 * /api/v1/users/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^[0-9]{10}$'
 *               profileUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
// router.patch('/profile', auth('updateProfile'), validate(updateProfileSchema), userController.updateProfile);



// Upload avatar
router.post('/avatar', auth('updateProfile'), profileController.uploadAvatar);

// Upload cover image
router.post('/cover', auth('updateProfile'), profileController.uploadCoverImage);

// Delete user
router.delete('/:userId', auth('deleteUser'), userController.deleteUser);

module.exports = router;

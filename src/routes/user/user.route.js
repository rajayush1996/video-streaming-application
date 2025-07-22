/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const userController = require("../../controllers/user.controller");
const auth = require("../../middlewares/auth.middleware");
const { validate } = require('../../middlewares/validation.middleware');
const { updateProfileSchema } = require('../../validations/user.validation');
const profileController = require('../../controllers/profile.controller');

/**
 * @swagger
 * /api/v1/user/profile/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 name:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 isCreator:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/me', auth('user'), userController.getUserById);

/**
 * @swagger
 * /api/v1/user/profile/me:
 *   put:
 *     summary: Update current user profile
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
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
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
router.put('/me', validate(updateProfileSchema), userController.updateUser);

/**
 * @swagger
 * /api/v1/user/profile/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Invalid file or no file uploaded
 *       401:
 *         description: Unauthorized
 */
router.post('/avatar', profileController.uploadAvatar);

/**
 * @swagger
 * /api/v1/user/profile/cover:
 *   post:
 *     summary: Upload user cover image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cover image uploaded successfully
 *       400:
 *         description: Invalid file or no file uploaded
 *       401:
 *         description: Unauthorized
 */
router.post('/cover', profileController.uploadCoverImage);

/**
 * @swagger
 * /api/v1/user/profile/{userId}:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot delete other users
 *       404:
 *         description: User not found
 */
router.delete('/:userId', userController.deleteUser);

/**
 * @swagger
 * /api/v1/user/profile/{id}:
 *   get:
 *     summary: Get public user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Public profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 name:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 isCreator:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     followers:
 *                       type: number
 *                     following:
 *                       type: number
 *                     posts:
 *                       type: number
 *       404:
 *         description: User not found
 */
router.get('/:id', userController.getPublicProfile);

/**
 * @swagger
 * /api/v1/user/profile/{id}/follow:
 *   post:
 *     summary: Follow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully followed user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/:id/follow', userController.followUser);

/**
 * @swagger
 * /api/v1/user/profile/{id}/unfollow:
 *   post:
 *     summary: Unfollow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/:id/unfollow', userController.unfollowUser);

/**
 * @swagger
 * /api/v1/user/profile/{id}/followers:
 *   get:
 *     summary: Get user's followers
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id/followers', userController.getFollowers);

/**
 * @swagger
 * /api/v1/user/profile/{id}/following:
 *   get:
 *     summary: Get users that the user is following
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Following users retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id/following', userController.getFollowing);

/**
 * @swagger
 * /api/v1/user/profile/feed:
 *   get:
 *     summary: Get user's feed
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Feed retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/feed', userController.getUserFeed);

module.exports = router;

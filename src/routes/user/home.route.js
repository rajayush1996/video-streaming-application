const express = require('express');
const router = express.Router();
// const auth = require('../../middlewares/auth.middleware');
// const { validate } = require('../../middlewares/validation.middleware');
const homeController = require('../../controllers/home.controller');
// const homeValidation = require('../../validations/home.validation');

/**
 * @swagger
 * /api/v1/user/home:
 *   get:
 *     summary: Get home feed with mixed content
 *     tags: [Home]
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Home feed retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/',
    // auth('getUser'),
    // validate(homeValidation.getHomeSchema),
    homeController.getHomeFeed
);

module.exports = router; 
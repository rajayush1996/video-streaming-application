const express = require('express');
const auth = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const creatorRequestValidation = require('../validations/creatorRequest.validation');
const creatorRequestController = require('../controllers/creatorRequest.controller');

const router = express.Router();

/**
 * @swagger
 * /api/v1/creator-requests/user/me:
 *   get:
 *     tags: [Creator Requests]
 *     summary: Get creator request for current user
 *     description: Retrieve the creator request for the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Creator request retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No creator request found for user
 */
router.get('/user/me', auth('getCreatorRequests'), creatorRequestController.getRequestByUserId);

/**
 * @swagger
 * /api/v1/creator-requests:
 *   post:
 *     tags: [Creator Requests]
 *     summary: Create a new creator request
 *     description: Submit a new request to become a creator
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - portfolio
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for wanting to become a creator
 *               portfolio:
 *                 type: string
 *                 description: URL to portfolio or sample work
 *     responses:
 *       201:
 *         description: Creator request created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *   get:
 *     tags: [Creator Requests]
 *     summary: Get all creator requests
 *     description: Retrieve a list of all creator requests (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by request status
 *     responses:
 *       200:
 *         description: List of creator requests retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router
    .route('/')
    .post(auth('createCreatorRequest'), validate(creatorRequestValidation.createCreatorRequestSchema), creatorRequestController.createRequest)
    .get(auth('getCreatorRequests'), validate(creatorRequestValidation.getCreatorRequestsSchema), creatorRequestController.getRequests);

/**
 * @swagger
 * /api/v1/creator-requests/{id}:
 *   get:
 *     tags: [Creator Requests]
 *     summary: Get creator request by ID
 *     description: Retrieve a specific creator request by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Creator request ID
 *     responses:
 *       200:
 *         description: Creator request retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Creator request not found
 */
router.get('/:id', auth('getCreatorRequests'), creatorRequestController.getRequestById);

/**
 * @swagger
 * /api/v1/creator-requests/{id}/status:
 *   patch:
 *     tags: [Creator Requests]
 *     summary: Update creator request status
 *     description: Update the status of a creator request (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Creator request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: New status for the creator request
 *               adminNote:
 *                 type: string
 *                 description: Optional note from admin about the decision
 *     responses:
 *       200:
 *         description: Creator request status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Creator request not found
 */
router.patch('/:id/status', 
    // auth('updateCreatorRequest'), 
    validate(creatorRequestValidation.updateCreatorRequestSchema), 
    creatorRequestController.updateRequestStatus
);

module.exports = router; 
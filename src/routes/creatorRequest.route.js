const express = require('express');
const auth = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const creatorRequestValidation = require('../validations/creatorRequest.validation');
const creatorRequestController = require('../controllers/creatorRequest.controller');

const router = express.Router();

// Get request by user ID (must be before /:id route)
router.get('/user/me', auth('getCreatorRequests'), creatorRequestController.getRequestByUserId);

// Main routes
router
    .route('/')
    .post(auth('createCreatorRequest'), validate(creatorRequestValidation.createCreatorRequestSchema), creatorRequestController.createRequest)
    .get(auth('getCreatorRequests'), validate(creatorRequestValidation.getCreatorRequestsSchema), creatorRequestController.getRequests);

// Get request by ID
router.get('/:id', auth('getCreatorRequests'), creatorRequestController.getRequestById);

// Update request status
router.patch('/:id/status', 
    auth('updateCreatorRequest'), 
    validate(creatorRequestValidation.updateCreatorRequestSchema), 
    creatorRequestController.updateRequestStatus
);

module.exports = router; 
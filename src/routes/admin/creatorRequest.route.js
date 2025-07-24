const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const creatorRequestValidation = require('../../validations/creatorRequest.validation');
const creatorRequestController = require('../../controllers/creatorRequest.controller');

const router = express.Router();


router.patch('/:id/status', 
    auth('updateCreatorRequest'), 
    validate(creatorRequestValidation.updateCreatorRequestSchema), 
    creatorRequestController.updateRequestStatus
);

module.exports = router; 
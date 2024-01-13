/* eslint-disable new-cap */

const express = require('express');
const router = express.Router();
const {validate} = require('../middlewares/validation.middleware');
const {verifyOtpUser, sendOtpUser} = require('../controllers/auth.controller');
const {createUserSchema} = require('../validations/user.validaton');

router.post('/verify-otp', verifyOtpUser);
router.post('/send-otp', validate(createUserSchema), sendOtpUser);

module.exports = router;

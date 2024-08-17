
const _ = require('lodash');
const logger = require('../features/logger');
const config = require('../../config/config');
const i18nUtil = require('../services/i18n');
const UserService = require('./user.service');
const {generateOTP} = require('../utils/otp.util');
const jwt = require('jsonwebtoken');
const {ApiError} = require('../features/error');
const httpStatus = require('http-status');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const {authentication, otpVerification} = config;

// Mock database to store OTPs temporarily

// Configure the email transport using nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: otpVerification.email_user, // Your email
        pass: otpVerification.email_pass, // Your email password
    },
});

class AuthService {
    // Function to send OTP via email
    async sendOtpToEmail(body, language) {
        try {
            const appLanguage = _.get(language, 'en');
            const {email} = body;

            if (!email) {
                throw new ApiError(httpStatus.BAD_REQUEST, i18nUtil.getLocaleValue('EMAIL_FORMAT_ERROR', appLanguage));
            }

            const otp = generateOTP();
            const expireTime = 10; // Expire time in minutes
            const otpMessage = `Your OTP for TheAstroBharat: ${otp}\n\nValid for ${expireTime} minutes. Use it to verify your email.\n\nTheAstroBharat Team`;

            // Hash the OTP
            const hashedOtp = await hashOtp(otp);

            // Prepare user payload
            const userPayload = {
                hashedOtp,
                email,
            };

            // Check if the user already exists and is verified
            const existingUser = await UserService.getUserByEmail(email);
            if (existingUser && existingUser.isEmailVerified) {
                throw new ApiError(httpStatus.CONFLICT, i18nUtil.getLocaleValue('OTP_VERIFICATION_ERROR', appLanguage));
            }

            // Send OTP email
            const mailOptions = {
                from: otpVerification.email_user,
                to: email,
                subject: 'Your OTP Code',
                text: otpMessage,
            };

            const sendEmailP = transporter.sendMail(mailOptions);
            const updateUserP = UserService.updateByEmail(email, userPayload);
            const result = await Promise.all([sendEmailP, updateUserP]);

            // Ensure email was sent successfully
            if (!result[0].accepted.includes(email)) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send OTP email.');
            }

            logger.info(`OTP sent to email: ${email}`);
            return {message: 'OTP sent successfully!'};
        } catch (err) {
            logger.error('Error in sendOtpToEmail service:', err);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        }
    }

    // Function to verify OTP
    async verifyOtpUser(body, language) {
        try {
            const appLanguage = _.get(language, 'en');
            const userDetails = await UserService.getUserByMobNumber(body.mobNumber);

            if (!userDetails || !body.mobNumber) {
                const err = new ApiError(httpStatus.NOT_FOUND, i18nUtil.getLocaleValue('PHONE_NUMBER_ERROR', appLanguage));
                throw err;
            }

            if (!body.phoneOtp) {
                const err = new ApiError(httpStatus.NOT_FOUND, i18nUtil.getLocaleValue('PHONE_OTP_ERROR', appLanguage));
                throw err;
            }

            const isOTPValid = await compareOtp(body.phoneOtp, userDetails.hashedOtp);

            if (!isOTPValid) {
                const err = new ApiError(httpStatus.UNAUTHORIZED, {status: false, message: 'UNAUTHORIZED'});
                throw err;
            }

            body.isOtpVerified = true;
            body.hashedOtp = null;
            const updatesUserDetails = await UserService.updateByMobNumber(body.mobNumber, body);
            // SENDING BACK TO TOKEN
            const jwtToken = jwt.sign({mobNumber: updatesUserDetails.mobNumber}, authentication.refresh_token_secret_key, {
                expiresIn: authentication.jwt_token_expiration,
                algorithm: authentication.token_algortihm,
                issuer: authentication.jwt_token_issuer,
            });
            const refreshToken = jwt.sign({_id: updatesUserDetails._id}, authentication.jwt_token_secret_key, {
                expiresIn: authentication.refresh_token_expiration,
                algorithm: authentication.token_algortihm,
                issuer: authentication.refresh_token_issuer,
            });
            const responsePayload = {
                message: 'SUCCESS',
                status: true,
                usersInfo: {
                    phoneNumber: updatesUserDetails.phoneNumber,
                    isOtpVerified: updatesUserDetails.isOtpVerified,
                    role: body.role || 'CUSTOMER',
                    id: updatesUserDetails._id,
                },
                accessToken: {
                    token: jwtToken,
                    expiresIn: authentication.jwt_token_expiration,
                },
                refreshToken: {
                    token: refreshToken,
                    expireIn: authentication.refresh_token_expiration,
                },
            };
            return responsePayload;
        } catch (err) {
            logger.error(err);
            throw err;
        }
    }
}

const hashOtp = async function (otp) {
    const saltRounds = await bcrypt.genSalt(config.authentication.salt);
    const hashedOtp = await bcrypt.hashSync(otp, saltRounds);
    return hashedOtp;
};

const compareOtp = async function (otp, hashedOtp) {
    return bcrypt.compareSync(otp, hashedOtp);
};

module.exports = new AuthService();

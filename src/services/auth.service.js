const _ = require('lodash');
const logger = require('../features/logger');
const config = require('../../config/config');
const i18nUtil = require('../services/i18n');
const UserService = require('./user.service');
const {generateOTP, sendSms} = require('../utils/otp.util');
const jwt = require('jsonwebtoken');
const {ApiError} = require('../features/error');
const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const {authentication} = config;

class AuthService {
    async sendOtpMessage(body, language) {
        try {
            const appLanguage = _.get(language, 'en');
            const {phoneNumber} = body;
            const mobNumber = `${phoneNumber?.countryCode}${phoneNumber?.number}`;
            if (!mobNumber) {
                throw new Error(i18nUtil.getLocaleValue('MOB_NUM_FORMATS_ERROR', appLanguage));
            }

            const otp = generateOTP();
            const expireTime = 10;
            const otpMessage = `Your OTP for TheAstroBharat: ${otp}

            Valid for ${expireTime} minutes. Use it to verify your mobile number.

            TheAstroBharat Team
            `;

            const hashedOtp = await hashOtp(otp);
            const userPayload = {
                hashedOtp,
                mobNumber,
                phoneNumber,
            };
            const existingPhoneNumber = await UserService.getUserByMobNumber(mobNumber);
            if (existingPhoneNumber && existingPhoneNumber.isOtpVerified) {
                throw new Error(i18nUtil.getLocaleValue('OTP_VERIFICATION_ERROR', appLanguage));
            }

            const sendSmsP = sendSms({message: otpMessage, contactNumber: mobNumber});
            const updateUserP = UserService.updateByMobNumber(mobNumber, userPayload);
            const result = await Promise.all([sendSmsP, updateUserP]);
            return result;
        } catch (err) {
            logger.error('Error in service', err);
            throw err;
        }
    }

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

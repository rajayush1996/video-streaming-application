const AuthService = require('../services/auth.service');
const httpStatus = require('http-status');
const logger = require('../features/logger');
const { setRefreshTokenCookie, getRefreshTokenFromCookie } = require('../utils/cookies.util');

async function verifyOtpUser(req, res, next) {
    try {
        const { body } = req;
        const result = await AuthService.verifyOtpUser(body);
        return res.status(httpStatus.OK).json(result);
    } catch (err) {
        logger.error(err);
        next(err);
    }
}

async function sendOtpUser(req, res, next) {
    try {
        const { body } = req;
        const result = await AuthService.sendOtpToEmail(body);
        if (result) {
            return res.status(httpStatus.OK).json({ message: 'otp send successfully!' });
        }

        return res.status(httpStatus.FORBIDDEN).json({ status: false });
    } catch (err) {
        logger.error('Error in controller', err);
        next(err);
    }
}

async function signUp(req, res, next) {
    try {
        const { body } = req;
        const result = await AuthService.signUpUser(body);
        return res.status(httpStatus.CREATED).json(result);
    } catch(err) {
        logger.error('Error in signUp', err);
        next(err);
    }
}

async function signIn(req, res, next) {
    try {
        const { body } = req;
        const result = await AuthService.signInUser(body);
        const refreshToken = result.tokens.refreshToken;
        setRefreshTokenCookie(res, refreshToken);
        delete result.tokens.refreshToken;
        return res.status(httpStatus.OK).json(result);
    } catch(err) {
        logger.error('Error in signUp', err);
        next(err);
    }
}

async function verifyEmail(req, res, next) {
    try {
        const { token } = req.body;
        const result = await AuthService.verifyEmail(token);
        return res.status(httpStatus.OK).json(result);
    } catch(err) {
        logger.error('Error in verifying email', err.message);
        next(err);
    }
}

async function resendVerificationEmail(req, res, next) {
    try {
        const response =  await AuthService.resendVerificationEmail(req.body); 
        return res.status(httpStatus.OK).json(response);
    } catch(err) {
        logger.error('Error in resending verification email', err.message);
        next(err);
    }
}

async function verifyRefreshToken(req, res, next){
    try {
        const refreshToken = getRefreshTokenFromCookie(req);
        const accessToken =  AuthService.generateAccessToken(refreshToken);
        return res.status(httpStatus.OK).json({ accessToken });
    } catch (err) {
        console.error('Failed to generate access token:', err);
        next(err);
    }
}

module.exports = {
    verifyOtpUser,
    sendOtpUser,
    signUp,
    signIn,
    verifyEmail,
    resendVerificationEmail,
    verifyRefreshToken
};

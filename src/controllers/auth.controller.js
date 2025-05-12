const logger = require('../features/logger');
const { getRefreshTokenFromCookie } = require('../utils/cookies.util');
const { authService } = require('../services');
const httpStatus = require('http-status');
const { responseHandler, ApiError } = require('../features/error');

// Helper function to clean ANSI color codes from error messages
const cleanErrorMessage = (message) => {
    return message.replace(/\u001b\[\d+m/g, '').trim();
};

const signUp = async (req, res) => {
    try {
        const result = await authService.signUpUser(req.body);
        responseHandler(res, httpStatus.CREATED, 'User registered successfully', result);
    } catch (error) {
        logger.error('Error in signUp:', error);
        throw new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message));
    }
};

const userSignIn = async (req, res, next) => {
    try {
        const result = await authService.userSignIn(req.body, res);
        responseHandler(res, httpStatus.OK, 'Login successful', {
            user: result.user,
            accessToken: result.accessToken
        });
    } catch (error) {
        logger.error('Error in userSignIn:', error);
        if (error.isEmailNotVerified) {
            next(new ApiError(httpStatus.FORBIDDEN, cleanErrorMessage(error.message), {
                email: req.body.email,
                needsVerification: true,
                isEmailNotVerified: true,
                resendVerificationEndpoint: '/api/auth/resend-verification'
            }));
        } else if (error.isAccountLocked) {
            next(new ApiError(httpStatus.FORBIDDEN, cleanErrorMessage(error.message), {
                isAccountLocked: true,
                lockUntil: error.lockUntil
            }));
        } else {
            next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message), {
                isLoginError: true
            }));
        }
    }
};

const adminSignIn = async (req, res, next) => {
    try {
        const result = await authService.adminSignIn(req.body, res);
        responseHandler(res, httpStatus.OK, 'Login successful', {
            admin: result.admin,
            accessToken: result.accessToken
        });
    } catch (error) {
        logger.error('Error in adminSignIn:', error);
        next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message)));
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const result = await authService.verifyEmail(req.query.token);
        responseHandler(res, httpStatus.OK, 'Email verified successfully', result);
    } catch (error) {
        logger.error('Error in verifyEmail:', error);
        return next(
            error instanceof ApiError
                ? error
                : new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, error.message)
        );
    }
};

const verifyOtpUser = async (req, res, next) => {
    try {
        const result = await authService.verifyOtpUser(req.body);
        responseHandler(res, httpStatus.OK, 'OTP verified successfully', result);
    } catch (error) {
        logger.error('Error in verifyOtpUser:', error);
        next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message)));
    }
};

const sendOtpToEmail = async (req, res, next) => {
    try {
        const result = await authService.sendOtpToEmail(req.body);
        responseHandler(res, httpStatus.OK, 'OTP sent successfully', result);
    } catch (error) {
        logger.error('Error in sendOtpToEmail:', error);
        next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message)));
    }
};

const resendVerificationEmail = async (req, res, next) => {
    try {
        const result = await authService.resendVerificationEmail(req.body);
        responseHandler(res, httpStatus.OK, 'Verification email sent successfully', result);
    } catch (error) {
        logger.error('Error in resendVerificationEmail:', error);
        next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message)));
    }
};

const verifyRefreshToken = async (req, res, next) => {
    try {
        const refreshToken = getRefreshTokenFromCookie(req);
        if (!refreshToken) {
            next(new ApiError(httpStatus.UNAUTHORIZED, 'No refresh token found in cookies'));
        }

        const result = await authService.verifyRefreshToken(refreshToken);
        responseHandler(res, httpStatus.OK, 'Token refreshed successfully', result);
    } catch (error) {
        logger.error('Error in verifyRefreshToken:', error);
        next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message)));
    }
};

const requestPasswordReset = async (req, res, next) => {
    try {
        const result = await authService.requestPasswordReset(req.body.email);
        responseHandler(res, httpStatus.OK, 'Password reset link sent successfully', result);
    } catch (error) {
        logger.error('Error in requestPasswordReset:', error);
        next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message)));
    }
};

const verifyResetToken = async (req, res, next) => {
    try {
        const result = await authService.verifyResetToken(req.query.token);
        responseHandler(res, httpStatus.OK, 'Reset token is valid', result);
    } catch (error) {
        logger.error('Error in verifyResetToken:', error);
        next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message)));
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body);
        responseHandler(res, httpStatus.OK, 'Password reset successful', result);
    } catch (error) {
        logger.error('Error in resetPassword:', error);
        next(new ApiError(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR, cleanErrorMessage(error.message)));
    }
};

module.exports = {
    signUp,
    userSignIn,
    adminSignIn,
    verifyEmail,
    verifyOtpUser,
    sendOtpToEmail,
    resendVerificationEmail,
    verifyRefreshToken,
    requestPasswordReset,
    verifyResetToken,
    resetPassword
};

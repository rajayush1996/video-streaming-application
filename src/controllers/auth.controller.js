const AuthService = require('../services/auth.service');
const logger = require('../features/logger');
const { getRefreshTokenFromCookie } = require('../utils/cookies.util');
const { userService } = require('../services');
const { authService } = require('../services');
const httpStatus = require('http-status');
const { ApiError } = require('../features/error');

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

/**
 * @swagger
 * /api/v1/auth/signin:
 *   post:
 *     summary: Sign in with username/email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or email for login
 *                 minLength: 3
 *                 maxLength: 100
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
const signIn = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;
        
        // Try to find user by username or email
        const user = await userService.getUserByIdentifier(identifier);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new ApiError(httpStatus.FORBIDDEN, 'User account is inactive');
        }

        // Validate password using the User model's method
        const isPasswordValid = await user.isPasswordMatch(password);
        if (!isPasswordValid) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
        }

        // Generate auth token
        const token = authService.generateAuthTokens(user);
        
        // Create a safe user object without sensitive data
        const safeUser = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        
        res.status(httpStatus.OK).json({
            message: "User logged in successfully",
            data: {
                user: safeUser,
                token
            }
        });
    } catch (error) {
        logger.error('Error in signIn:', error);
        next(error);
    }
};

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

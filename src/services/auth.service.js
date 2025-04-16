const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserService = require('./user.service');
const { sendEmail } = require('../utils/transporter.util');
const { ApiError } = require('../features/error');
const httpStatus = require('http-status');
const logger = require('../features/logger');
const { authentication, emailVerification } = require('../../config');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

class AuthService {
    // User Signup (With Email Verification)
    async signUpUser(body) {
        try {
            const { email, password, role = 'USER' } = body;

            // Check if email already exists
            const existingUser = await UserService.getUserByEmail(email);
            if (existingUser) {
                throw new ApiError(httpStatus.CONFLICT, 'Email already exists.');
            }

            // Add password hashing
            const hashedPassword = await bcrypt.hash(password, authentication.salt_rounds);

            // Generate email verification token
            const emailVerificationToken = uuidv4();
            const emailVerificationExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minute

            // Create user with hashed password
            await UserService.createUser({
                email,
                password: hashedPassword,
                role,
                isEmailVerified: false,
                emailVerificationToken,
                emailVerificationExpires
            });

            // Send email verification link
            const verificationUrl = `${emailVerification.verification_url}/verify-email?token=${emailVerificationToken}`;
            await sendEmail(email, "Verify Your Email", `Click the link to verify: ${verificationUrl}`);

            return {
                message: 'User registered successfully. A verification link has been sent to your email.',
            };
        } catch (error) {
            logger.error(error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // Verify Email Link
    async verifyEmail(token) {
        try {
            const user = await UserService.getUserByVerificationToken(token);
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Invalid or expired verification link.');
            }

            // Check if the token has expired
            if (new Date() > user.emailVerificationExpires) {
                throw new ApiError(httpStatus.UNAUTHORIZED, 'Verification link has expired. Please request a new one.');
            }

            // Mark user as verified
            await UserService.updateUser(user._id, {
                isEmailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
            });

            return { message: 'Email verified successfully. You can now log in.', success: true };
        } catch (error) {
            logger.error(error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // Resend Verification Email
    async resendVerificationEmail(body) {
        try {
            const { email } = body;
            const user = await UserService.getUserByEmail(email);
            if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');

            if (user.isEmailVerified) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Email is already verified.');
            }

            // Generate new verification token
            const emailVerificationToken = uuidv4();
            const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
            await UserService.updateUser(user._id, { emailVerificationToken, emailVerificationExpires });

            const verificationUrl = `${emailVerification.verification_url}/api/v1/auth/verify-email?token=${emailVerificationToken}`;
            await sendEmail(email, "Verify Your Email", `Click the link to verify: ${verificationUrl}`);

            return { message: 'Verification email resent successfully.', success: true };
        } catch (error) {
            logger.error(error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // User SignIn
    async signInUser(body) {
        try {
            const { email, password } = body;

            // Check if user exists
            const user = await UserService.getUserByEmail(email);
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
            }

            // Validate password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials.');
            }

            // Check if email is verified
            if (!user.isEmailVerified) {
                throw new ApiError(httpStatus.FORBIDDEN, 'Please verify your email before logging in.');
            }

            // Generate JWT tokens
            const tokens = this.generateAuthTokens(user);

            return {
                message: 'User logged in successfully',
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                },
                tokens,
            };
        } catch (error) {
            logger.error(error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // Generate JWT Tokens
    generateAuthTokens(user) {
        const payload = { id: user._id, email: user.email, role: user.role };

        const accessToken = jwt.sign(payload, authentication.jwt_token_secret_key, {
            expiresIn: authentication.jwt_token_expiration,
            algorithm: authentication.token_algortihm,
            issuer: authentication.jwt_token_issuer,
        });

        const refreshToken = jwt.sign(payload, authentication.refresh_token_secret_key, {
            expiresIn: authentication.refresh_token_expiration,
            algorithm: authentication.token_algortihm,
            issuer: authentication.refresh_token_issuer,
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    generateAccessToken = (refreshToken) => {
        try {
            // Verify the refresh token
            const payload = jwt.verify(refreshToken, authentication.refresh_token_secret_key);
            const accessTokenPayload = {
                id: payload.id,
                email: payload.email,
                role: payload.role
            }
            console.log("🚀 ~ AuthService ~ accessTokenPayload:", accessTokenPayload)
            // Optional: Check token existence in DB (blacklist or session-based security)
      
            // Re-issue a new access token
            const accessToken = jwt.sign(
                accessTokenPayload, // You can include any data you want
                authentication.jwt_token_secret_key,
                {
                    expiresIn: authentication.jwt_token_expiration,
                    algorithm: authentication.token_algortihm,
                    issuer: authentication.jwt_token_issuer,
                }
            );
      
            return accessToken;
        } catch (err) {
            console.error('Failed to generate access token:', err);
            throw new Error('Invalid refresh token');
        }
    };

    // Add rate limiting
    getAuthLimiter() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5 // limit each IP to 5 requests per windowMs
        });
    }

    // Add password strength validation
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*]/.test(password);
        
        return password.length >= minLength && 
               hasUpperCase && 
               hasLowerCase && 
               hasNumbers && 
               hasSpecialChar;
    }
}

module.exports = new AuthService();

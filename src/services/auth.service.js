const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/transporter.util');
const { AppError, ConflictError, UnauthorizedError, NotFoundError, BadRequestError, ForbiddenError } = require('../features/error');
const httpStatus = require('http-status');
const logger = require('../features/logger');
const { authentication, emailVerification } = require('../../config');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const UserCredentials = require('../models/userCredentials.model');
const UserProfile = require('../models/userProfile.model');
const otpGenerator = require('otp-generator');
const { encrypt } = require('../utils/security.util');
const { setRefreshTokenCookie } = require('../utils/cookies.util');

class AuthService {
    // User Signup (With Email Verification)
    async signUpUser(body) {
        try {
            const { email, password, username, role = 'user' } = body;

            // Check if email or username already exists
            const existingUser = await UserCredentials.findOne({ 
                $or: [{ email }, { username }] 
            });
            if (existingUser) {
                throw new ConflictError('Email or username already exists.');
            }

            // Generate email verification token
            const emailVerificationToken = uuidv4();
            const emailVerificationExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minute

            // Create user credentials
            const user = await UserCredentials.create({
                username,
                email,
                password,
                role,
                isEmailVerified: false,
                emailVerificationToken,
                emailVerificationExpires
            });

            // Create user profile
            await UserProfile.create({
                userId: user._id,
                displayName: username
            });

            // Send email verification link
            const verificationUrl = `${emailVerification.verification_url}/activate-account?token=${emailVerificationToken}`;
            await sendEmail(email, "Verify Your Email", `Click the link to verify: ${verificationUrl}`);

            return {
                message: 'User registered successfully. A verification link has been sent to your email.',
            };
        } catch (error) {
            logger.error(error);
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, error.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Verify Email Link
    async verifyEmail(token) {
        try {
            const user = await UserCredentials.findOne({ emailVerificationToken: token });
            if (!user) {
                throw new NotFoundError('Invalid or expired verification link.');
            }

            // Check if the token has expired
            if (new Date() > user.emailVerificationExpires) {
                throw new UnauthorizedError('Verification link has expired. Please request a new one.');
            }

            // Mark user as verified
            await UserCredentials.findByIdAndUpdate(user._id, {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null,
            });

            return { message: 'Email verified successfully. You can now log in.', success: true };
        } catch (error) {
            logger.error(error);
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, error.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Resend Verification Email
    async resendVerificationEmail(body) {
        try {
            const { email } = body;
            const user = await UserCredentials.findOne({ email });
            if (!user) throw new NotFoundError('User not found.');

            if (user.isEmailVerified) {
                throw new BadRequestError('Email is already verified.');
            }

            // Generate new verification token
            const emailVerificationToken = uuidv4();
            const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
            await UserCredentials.findByIdAndUpdate(user._id, { 
                emailVerificationToken, 
                emailVerificationExpires 
            });

            const verificationUrl = `${emailVerification.verification_url}/activate-account?token=${emailVerificationToken}`;
            await sendEmail(email, "Verify Your Email", `Click the link to verify: ${verificationUrl}`);

            return { message: 'Verification email resent successfully.', success: true };
        } catch (error) {
            logger.error(error);
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, error.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // User SignIn
    async userSignIn({ email, password }, res) {
        try {
            const user = await UserCredentials.findOne({ 
                email,
                role: 'user'
            }).select('+password');

            if (!user) {
                throw new UnauthorizedError('Invalid credentials');
            }

            if (!user.emailVerified) {
                const error = new ForbiddenError('Please verify your email first. You can request a new verification email by clicking the resend verification link.');
                error.isEmailNotVerified = true;
                throw error;
            }

            if (user.lockUntil && user.lockUntil > Date.now()) {
                const error = new ForbiddenError('Account is locked. Please try again later');
                error.isAccountLocked = true;
                error.lockUntil = user.lockUntil;
                throw error;
            }

            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                // Increment failed login attempts
                user.loginAttempts = (user.loginAttempts || 0) + 1;
                
                // Lock account after 5 failed attempts
                if (user.loginAttempts >= 5) {
                    user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                }
                
                await user.save();
                throw new UnauthorizedError('Invalid credentials');
            }

            // Reset login attempts on successful login
            user.loginAttempts = 0;
            user.lockUntil = null;
            user.lastLogin = new Date();
            await user.save();

            const tokens = await this.generateAuthTokens(user);
            
            // Set refresh token in HTTP-only cookie
            setRefreshTokenCookie(res, tokens.refreshToken);
            
            return {
                message: 'Login successful',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                accessToken: tokens.accessToken
            };
        } catch (error) {
            logger.error('Error in userSignIn:', error);
            throw error;
        }
    }

    // Admin SignIn
    async adminSignIn({ identifier, password }, res) {
        try {
            const admin = await UserCredentials.findOne({
                $or: [
                    { username: identifier },
                    { email: identifier }
                ],
                role: 'admin'
            });

            if (!admin) {
                throw new UnauthorizedError('Invalid credentials');
            }

            // Check if account is locked
            if (admin.lockUntil && admin.lockUntil > Date.now()) {
                throw new UnauthorizedError('Account is locked. Please try again later');
            }

            const isPasswordValid = await admin.comparePassword(password);
            if (!isPasswordValid) {
                // Increment failed login attempts
                admin.loginAttempts = (admin.loginAttempts || 0) + 1;
                
                // Lock account after 5 failed attempts for 30 minutes
                if (admin.loginAttempts >= 5) {
                    admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                }
                
                await admin.save();
                throw new UnauthorizedError('Invalid credentials');
            }

            // Reset login attempts on successful login
            admin.loginAttempts = 0;
            admin.lockUntil = null;
            admin.lastLogin = new Date();
            await admin.save();

            const tokens = await this.generateAuthTokens(admin);
            console.log("🚀 ~ AuthService ~ adminSignIn ~ tokens:", tokens);
            
            // Set refresh token in HTTP-only cookie
            setRefreshTokenCookie(res, tokens.refreshToken);
            
            return {
                message: 'Login successful',
                admin: {
                    id: admin._id,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role
                },
                accessToken: tokens.accessToken // Only return access token in response
            };
        } catch (error) {
            logger.error('Error in adminSignIn:', error);
            throw error;
        }
    }

    // Generate JWT Tokens
    async generateAuthTokens(user) {
        const payload = { 
            id: user._id, 
            username: user.username, 
            role: user.role 
        };

        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);

        return {
            accessToken,
            refreshToken,
        };
    }

    generateAccessToken(payload) {
        return jwt.sign(
            payload,
            authentication.jwt_token_secret_key,
            {
                expiresIn: authentication.jwt_token_expiration,
                algorithm: authentication.token_algortihm,
                issuer: authentication.jwt_token_issuer,
            }
        );
    }

    generateRefreshToken(payload) {
        return jwt.sign(
            payload,
            authentication.refresh_token_secret_key,
            {
                expiresIn: authentication.refresh_token_expiration,
                algorithm: authentication.token_algortihm,
                issuer: authentication.refresh_token_issuer,
            }
        );
    }

    async verifyRefreshToken(refreshToken) {
        try {
            // Verify the refresh token
            const payload = jwt.verify(
                refreshToken, 
                authentication.refresh_token_secret_key,
                {
                    algorithms: [authentication.token_algortihm],
                    issuer: authentication.refresh_token_issuer
                }
            );

            // Generate new access token
            const accessToken = this.generateAccessToken({
                id: payload.id,
                username: payload.username,
                role: payload.role
            });

            return { accessToken };
        } catch (error) {
            logger.error('Failed to verify refresh token:', error);
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Refresh token has expired');
            }
            throw new UnauthorizedError('Invalid refresh token');
        }
    }

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

    async sendOtpToEmail(emailData) {
        try {
            const { email } = emailData;
            
            // Check if user exists
            const user = await UserCredentials.findOne({ email });
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Generate OTP
            const otp = otpGenerator.generate(6, {
                digits: true,
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false
            });

            // Encrypt OTP for storage
            const hashedOtp = encrypt(otp);

            // Store OTP in user document
            await UserCredentials.findByIdAndUpdate(user._id, {
                hashedOtp,
                otpExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            });

            // Send OTP via email
            await sendEmail(
                email,
                'Your OTP Code',
                `Your OTP code is: ${otp}. This code will expire in 10 minutes.`
            );

            return { message: 'OTP sent successfully' };
        } catch (error) {
            logger.error('Error sending OTP:', error);
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, error.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async verifyOtpUser(otpData) {
        try {
            const { email, otp } = otpData;

            // Find user
            const user = await UserCredentials.findOne({ email });
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Check if OTP exists and hasn't expired
            if (!user.hashedOtp || !user.otpExpires) {
                throw new BadRequestError('No OTP found. Please request a new OTP');
            }

            if (new Date() > user.otpExpires) {
                throw new BadRequestError('OTP has expired. Please request a new OTP');
            }

            // Verify OTP
            const hashedInputOtp = encrypt(otp);
            if (hashedInputOtp !== user.hashedOtp) {
                throw new UnauthorizedError('Invalid OTP');
            }

            // Clear OTP after successful verification
            await UserCredentials.findByIdAndUpdate(user._id, {
                hashedOtp: null,
                otpExpires: null,
                isOtpVerified: true
            });

            return { message: 'OTP verified successfully' };
        } catch (error) {
            logger.error('Error verifying OTP:', error);
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, error.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Request Password Reset
    async requestPasswordReset(email) {
        try {
            const user = await UserCredentials.findOne({ email });
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Generate password reset token
            const resetToken = uuidv4();
            const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            // Save reset token to user
            await UserCredentials.findByIdAndUpdate(user._id, {
                passwordResetToken: resetToken,
                passwordResetExpires: resetTokenExpires
            });

            // Send reset password email
            const resetUrl = `${emailVerification.verification_url}/reset-password?token=${resetToken}`;
            await sendEmail(
                email,
                "Reset Your Password",
                `Click the link to reset your password: ${resetUrl}. This link will expire in 15 minutes.`
            );

            return { message: 'Password reset link has been sent to your email.' };
        } catch (error) {
            logger.error('Error in requestPasswordReset:', error);
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, error.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Verify Reset Token
    async verifyResetToken(token) {
        try {
            const user = await UserCredentials.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: Date.now() }
            });

            if (!user) {
                throw new UnauthorizedError('Invalid or expired password reset token');
            }

            return { message: 'Reset token is valid', email: user.email };
        } catch (error) {
            logger.error('Error in verifyResetToken:', error);
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, error.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Reset Password
    async resetPassword({ newPassword, confirmPassword, token }) {
        try {
            if (newPassword !== confirmPassword) {
                throw new BadRequestError('Passwords do not match');
            }

            const user = await UserCredentials.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: Date.now() }
            });
            console.log("🚀 ~ AuthService ~ resetPassword ~ user:", user);

            if (!user) {
                throw new UnauthorizedError('Invalid or expired password reset token');
            }

            // Update password and clear reset token
            user.password = newPassword;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            // Send confirmation email
            await sendEmail(
                user.email,
                "Password Reset Successful",
                "Your password has been successfully reset. If you did not make this change, please contact support immediately."
            );

            return { message: 'Password has been reset successfully' };
        } catch (error) {
            logger.error('Error in resetPassword:', error);
            if (error instanceof AppError) throw error;
            throw new AppError(error.message, error.statusCode || httpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new AuthService();

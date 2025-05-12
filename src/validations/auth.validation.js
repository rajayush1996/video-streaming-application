const Joi = require('joi');

const signUpSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    username: Joi.string().min(3).required(),
    role: Joi.string().valid('USER', 'ADMIN').default('USER')
});

const userSignInSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const adminSignInSchema = Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    })
});

const verifyResetTokenSchema = Joi.object({
    token: Joi.string().required().messages({
        'any.required': 'Reset token is required'
    })
});

const resetPasswordSchema = Joi.object({
    newPassword: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
            'any.required': 'New password is required'
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Passwords do not match',
            'any.required': 'Please confirm your password'
        })
});

module.exports = {
    signUpSchema,
    userSignInSchema,
    adminSignInSchema,
    forgotPasswordSchema,
    verifyResetTokenSchema,
    resetPasswordSchema
}; 
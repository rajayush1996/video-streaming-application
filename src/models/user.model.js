const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;
const utils = require('../utils/utils');
const { toJSON, paginate } = require('./plugins');

const userSchema = new Schema(
    {
        _id: {
            type: String,
        },
        firstName: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        lname: {
            type: String,
            lowercase: true,
        },
        phoneNumber: {
            countryCode: {
                type: String,
                required: false, // Optional country code
            },
            number: {
                type: String,
                required: false, // Optional phone number
                trim: true,
                unique: true,
            },
        },
        emailVerificationToken: {
            type: String,
            unique: true
        },
        emailVerificationExpires: { type: Date, required: false },
        email: {
            type: String,
            required: true,
            unique: true, // Ensure email uniqueness
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address.'], // Email format validation
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        hashedOtp: {
            type: String,
        },
        password: {
            type: String,
            required: true,
            minlength: 8, // Ensure password has a minimum length
        },
        dob: {
            type: Date,
            required: false,
            validate: {
                validator(value) {
                    // Validate DOB to ensure the user is at least 18 years old
                    const today = new Date();
                    const age = today.getFullYear() - value.getFullYear();
                    if (
                        age > 18
            || (age === 18
              && today.getMonth() >= value.getMonth()
              && today.getDate() >= value.getDate())
                    ) {
                        return true;
                    }

                    return false;
                },
                message: 'User must be at least 18 years old.',
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isOtpVerified: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ['USER', 'ADMIN'],
        },
        mobNumber: {
            type: String,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

// Pre-save hook to hash password before saving user
userSchema.pre('save', async function (next) {
    const user = this;

    // Generate UUID if _id is not present
    if (!user._id) {
        user._id = await utils.uuid('u-');
    }

    // Hash password if it has been modified or is new
    if (user.isModified('password')) {
        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
    }

    next();
});

/**
 * Method to compare input password with hashed password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
};

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;

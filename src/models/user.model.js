const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;
const utils = require('../utils/utils');
const { toJSON, paginate } = require('./plugins')
const config = require('../../config');

const auth = config.authentication;

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
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 30,
        },
        phoneNumber: {
            countryCode: {
                type: String,
                required: false,
            },
            number: {
                type: String,
                required: false,
                trim: true,
                unique: false,
            },
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            private: true,
        },
        role: {
            type: String,
            enum: ['USER', 'ADMIN', 'CREATOR'],
            default: 'USER',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Add plugins
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

// Pre-save hook to hash password before saving user
userSchema.pre('validate', async function (next) {
    const user = this;
    console.log("🚀 ~ user:", user);

    // Generate UUID if _id is not present
    if (!user._id) {
        user._id = await utils.uuid('u-');
    }

    // Hash password if it has been modified or is new
    if (user.isModified('password')) {
        const saltRounds = auth.salt_rounds;
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

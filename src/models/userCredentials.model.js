const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../../config');
const utils = require('../utils');

const userCredentialsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: null
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'banned'],
        default: 'active'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    _id: false // Disable auto _id generation
});

// Generate UUID with prefix before saving
userCredentialsSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('u-');
    }
    next();
});

// Hash password before saving
userCredentialsSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(config.authentication.salt_rounds);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userCredentialsSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userCredentialsSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userCredentialsSchema.methods.incrementLoginAttempts = async function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return await this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    return await this.updateOne(updates);
};

const UserCredentials = mongoose.model('UserCredentials', userCredentialsSchema);

module.exports = UserCredentials; 
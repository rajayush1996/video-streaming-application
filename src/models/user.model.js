const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../../config');

const userSchema = new mongoose.Schema({
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
    avatar: {
        type: String,
        default: ''
    },
    coverImage: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        maxlength: 500,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    socialLinks: {
        twitter: String,
        instagram: String,
        youtube: String
    },
    stats: {
        followers: {
            type: Number,
            default: 0
        },
        following: {
            type: Number,
            default: 0
        },
        posts: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

const mongoose = require('mongoose');
const utils = require('../utils');
const auditPlugin = require('./plugins/audit.plugin');

const userProfileSchema = new mongoose.Schema({
    _id: {
        type: String,
    },
    userId: {
        type: String,
        ref: 'UserCredentials',
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: 50
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
        trim: true,
        maxlength: 500
    },
    location: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    socialLinks: {
        twitter: String,
        facebook: String,
        instagram: String,
        linkedin: String,
        youtube: String
    },
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserCredentials'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserCredentials'
    }],
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
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        }
    },
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        pushNotifications: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    achievements: [{
        type: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: String,
        icon: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    badges: [{
        type: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        description: String,
        icon: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    recentActivity: [{
        type: {
            type: String,
            enum: ['post', 'like', 'comment', 'follow', 'achievement'],
            required: true
        },
        referenceId: String,
        description: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true,
    _id: false // Disable auto _id generation
});

// Generate UUID with prefix before saving
userProfileSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('up-');
    }
    next();
});

// Apply audit plugin
userProfileSchema.plugin(auditPlugin, { resourceType: 'PROFILE' });

// Index for faster queries
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ displayName: 'text', bio: 'text' });
userProfileSchema.index({ 'stats.followers': -1 });
userProfileSchema.index({ 'stats.posts': -1 });

// Virtual for full profile URL
userProfileSchema.virtual('profileUrl').get(function() {
    return `/api/v1/users/${this.userId}`;
});

// Method to update stats
userProfileSchema.methods.updateStats = async function(statType, increment = 1) {
    const update = {};
    update[`stats.${statType}`] = increment;
    return await this.updateOne({ $inc: update });
};

// Method to add achievement
userProfileSchema.methods.addAchievement = async function(achievement) {
    return await this.updateOne({
        $push: {
            achievements: {
                $each: [achievement],
                $sort: { earnedAt: -1 }
            }
        }
    });
};

// Method to add recent activity
userProfileSchema.methods.addActivity = async function(activity) {
    return await this.updateOne({
        $push: {
            recentActivity: {
                $each: [activity],
                $sort: { createdAt: -1 },
                $slice: 50 // Keep only last 50 activities
            }
        }
    });
};

// Method to convert to JSON
userProfileSchema.methods.toJSON = function() {
    const profile = this.toObject();
    delete profile.__v;
    return profile;
};

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile; 
const mongoose = require('mongoose');
const utils = require('../utils');
const auditPlugin = require('./plugins/audit.plugin');

const mediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    creatorId: {
        type: String,
        ref: 'UserCredentials',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'processing', 'published', 'rejected'],
        default: 'draft'
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'followers'],
        default: 'public'
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    thumbnail: {
        type: String,
        default: ''
    },
    videoUrl: {
        type: String,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: [{
        type: String,
        ref: 'UserCredentials'
    }],
    likesCount: {
        type: Number,
        default: 0
    },
    comments: [{
        userId: {
            type: String,
            ref: 'UserCredentials',
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        likes: [{
            type: String,
            ref: 'UserCredentials'
        }],
        likesCount: {
            type: Number,
            default: 0
        },
        replies: [{
            userId: {
                type: String,
                ref: 'UserCredentials',
                required: true
            },
            text: {
                type: String,
                required: true,
                trim: true
            },
            likes: [{
                type: String,
                ref: 'UserCredentials'
            }],
            likesCount: {
                type: Number,
                default: 0
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    commentsCount: {
        type: Number,
        default: 0
    },
    shares: [{
        userId: {
            type: String,
            ref: 'UserCredentials',
            required: true
        },
        platform: {
            type: String,
            enum: ['facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'copy'],
            required: true
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    sharesCount: {
        type: Number,
        default: 0
    },
    bookmarks: [{
        type: String,
        ref: 'UserCredentials'
    }],
    bookmarksCount: {
        type: Number,
        default: 0
    },
    engagement: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        bookmarks: { type: Number, default: 0 }
    },
    analytics: {
        dailyViews: [{ date: Date, count: Number }],
        watchTimeDistribution: [{ range: String, count: Number }],
        viewerDemographics: {
            ageGroups: [{ range: String, percentage: Number }],
            locations: [{ country: String, count: Number }],
            devices: [{ type: String, count: Number }]
        }
    }
}, {
    timestamps: true,
    _id: false // Disable auto _id generation
});

// Generate UUID with prefix before saving
mediaSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('m-');
    }
    next();
});

// Apply audit plugin
mediaSchema.plugin(auditPlugin, { resourceType: 'MEDIA' });

// Indexes
mediaSchema.index({ creatorId: 1 });
mediaSchema.index({ category: 1 });
mediaSchema.index({ status: 1 });
mediaSchema.index({ 'tags': 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ 'engagement.views': -1 });
mediaSchema.index({ 'engagement.likes': -1 });

// Methods
mediaSchema.methods.incrementViews = async function() {
    this.views += 1;
    this.engagement.views += 1;
    return this.save();
};

mediaSchema.methods.toggleLike = async function(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
        this.likes.push(userId);
        this.likesCount += 1;
        this.engagement.likes += 1;
    } else {
        this.likes.splice(index, 1);
        this.likesCount -= 1;
        this.engagement.likes -= 1;
    }
    return this.save();
};

mediaSchema.methods.addComment = async function(userId, text) {
    this.comments.push({
        userId,
        text,
        likes: [],
        likesCount: 0,
        replies: [],
        createdAt: new Date()
    });
    this.commentsCount += 1;
    this.engagement.comments += 1;
    return this.save();
};

mediaSchema.methods.toggleCommentLike = async function(commentId, userId) {
    const comment = this.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');

    const index = comment.likes.indexOf(userId);
    if (index === -1) {
        comment.likes.push(userId);
        comment.likesCount += 1;
    } else {
        comment.likes.splice(index, 1);
        comment.likesCount -= 1;
    }
    return this.save();
};

mediaSchema.methods.addReply = async function(commentId, userId, text) {
    const comment = this.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');

    comment.replies.push({
        userId,
        text,
        likes: [],
        likesCount: 0
    });
    return this.save();
};

mediaSchema.methods.toggleReplyLike = async function(commentId, replyId, userId) {
    const comment = this.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');

    const reply = comment.replies.id(replyId);
    if (!reply) throw new Error('Reply not found');

    const index = reply.likes.indexOf(userId);
    if (index === -1) {
        reply.likes.push(userId);
        reply.likesCount += 1;
    } else {
        reply.likes.splice(index, 1);
        reply.likesCount -= 1;
    }
    return this.save();
};

mediaSchema.methods.addShare = async function(userId, platform) {
    this.shares.push({
        userId,
        platform,
        sharedAt: new Date()
    });
    this.sharesCount += 1;
    this.engagement.shares += 1;
    return this.save();
};

mediaSchema.methods.toggleBookmark = async function(userId) {
    const index = this.bookmarks.indexOf(userId);
    if (index === -1) {
        this.bookmarks.push(userId);
        this.bookmarksCount += 1;
        this.engagement.bookmarks += 1;
    } else {
        this.bookmarks.splice(index, 1);
        this.bookmarksCount -= 1;
        this.engagement.bookmarks -= 1;
    }
    return this.save();
};

mediaSchema.methods.updateAnalytics = async function(data) {
    if (data.dailyViews) {
        this.analytics.dailyViews.push(data.dailyViews);
    }
    if (data.watchTimeDistribution) {
        this.analytics.watchTimeDistribution.push(data.watchTimeDistribution);
    }
    if (data.viewerDemographics) {
        this.analytics.viewerDemographics = data.viewerDemographics;
    }
    return this.save();
};

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media; 
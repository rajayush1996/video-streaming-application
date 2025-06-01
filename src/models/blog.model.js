const mongoose = require("mongoose");
const { toJSON, paginate } = require('./plugins')
const utils = require('../utils/utils');
const auditPlugin = require('./plugins/audit.plugin');
const baseContentSchema = require('./baseContent.model');

const blogSchema = new mongoose.Schema({
    ...baseContentSchema.obj,
    blogSpecific: {
        excerpt: {
            type: String,
            required: [true, 'Excerpt is required'],
            trim: true,
            maxlength: [500, 'Excerpt cannot exceed 500 characters']
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true
        },
        readTime: {
            type: String,
            required: [true, 'Read time is required'],
            trim: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true,
    _id: false
});

// Generate UUID with prefix before saving
blogSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('b-');
    }
    next();
});

// Add query middleware to exclude soft-deleted blogs by default
blogSchema.pre(/^find/, function(next) {
    if (!this.getQuery().includeDeleted) {
        this.where({ deletedAt: null });
    }
    next();
});

blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);
blogSchema.plugin(auditPlugin, { resourceType: 'BLOG' });

// Indexes
blogSchema.index({ authorId: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ featured: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ 'engagement.views': -1 });
blogSchema.index({ 'engagement.likes': -1 });
blogSchema.index({ 'blogSpecific.category': 1 });
blogSchema.index({ 'blogSpecific.date': -1 });

// Methods
blogSchema.methods.incrementViews = async function() {
    this.views += 1;
    this.engagement.views += 1;
    return this.save();
};

blogSchema.methods.toggleLike = async function(userId) {
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

blogSchema.methods.addComment = async function(userId, text) {
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

blogSchema.methods.toggleCommentLike = async function(commentId, userId) {
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

blogSchema.methods.addReply = async function(commentId, userId, text) {
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

blogSchema.methods.toggleReplyLike = async function(commentId, replyId, userId) {
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

blogSchema.methods.addShare = async function(userId, platform) {
    this.shares.push({
        userId,
        platform,
        sharedAt: new Date()
    });
    this.sharesCount += 1;
    this.engagement.shares += 1;
    return this.save();
};

blogSchema.methods.toggleBookmark = async function(userId) {
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

blogSchema.methods.updateAnalytics = async function(data) {
    if (data.dailyViews) {
        this.analytics.dailyViews.push(data.dailyViews);
    }
    if (data.readTimeDistribution) {
        this.analytics.readTimeDistribution.push(data.readTimeDistribution);
    }
    if (data.readerDemographics) {
        this.analytics.readerDemographics = data.readerDemographics;
    }
    return this.save();
};

/**
 * @typedef Blog
 */
const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;

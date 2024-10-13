const mongoose = require('mongoose');
const { Schema } = mongoose;
const { paginate, toJSON } = require('./plugins');
const utils = require('../utils');

const FeedSchema = new Schema({
    type: {
        type: String,
        enum: ['POST', 'SHOW', 'COLLAB', 'AUDIO'],
        required: true,
    },
    _id: {
        type: String,
        auto: true,
    },
    authorId: {
        type: String,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    visibility: {
        type: String,
        enum: ['PUBLIC', 'PRIVATE'],
        default: 'PUBLIC',
    },
    likesCount: {
        type: Number,
        default: 0,
    },
    commentsCount: {
        type: Number,
        default: 0,
    },
    sharesCount: {
        type: Number,
        default: 0,
    },
    media: {
        type: [String],
    },
    tags: [{
        type: String, // Hashtags or relevant keywords
    }],
    mentions: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    location: {
        type: String, // Location metadata if applicable
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
    reactions: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        type: {
            type: String,
            enum: ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'],
        },
        reactedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    comments: [{
        commentId: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
        },
    }],
}, {
    timestamps: true
});

// Add plugin that converts mongoose to json
FeedSchema.plugin(toJSON);
FeedSchema.plugin(paginate);

FeedSchema.pre('save', async function (next) {
    const feed = this;
    if (!feed._id) {
        feed._id = utils.uuid('fe-');
    }
    next();
});

module.exports = mongoose.model('Feed', FeedSchema);
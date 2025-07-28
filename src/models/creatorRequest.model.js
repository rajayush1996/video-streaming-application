const mongoose = require('mongoose');
const utils = require('../utils');
const { toJSON, paginate } = require('./plugins');

const creatorRequestSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: null
    },
    userId: {
        type: String,
        ref: 'UserCredentials',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reason: {
        type: String,
        // required: true,
        maxlength: 500
    },
    portfolio: {
        type: String,
        maxlength: 1000
    },
    socialLinks: {
        youtube: String,
        instagram: String,
        twitter: String,
        website: String
    },
    reviewedBy: {
        type: String,
        ref: 'UserCredentials'
    },
    contentFocus: {
        type: String,
        // required: true
    },
    documents: {
        type: [String],
        required: true,
    },
    reviewedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        maxlength: 500
    },
    name: {
        type: String
    },
    idProof: {
        type: String
    },
    photo: {
        type: String
    }
}, {
    timestamps: true,
    _id: false
});

creatorRequestSchema.plugin(toJSON);
creatorRequestSchema.plugin(paginate);

// Generate UUID with prefix before saving
creatorRequestSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('cr-');
    }
    next();
});

// Indexes
creatorRequestSchema.index({ userId: 1, status: 1 });
creatorRequestSchema.index({ status: 1, createdAt: -1 });

const CreatorRequest = mongoose.model('CreatorRequest', creatorRequestSchema);

module.exports = CreatorRequest; 
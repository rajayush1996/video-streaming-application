const mongoose = require('mongoose');
const utils = require('../utils');
const { toJSON, paginate } = require('./plugins');

const mediaMetadataSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId || String,
    },
    thumbnailId: { type: String, required: true, unique: true },
    mediaFileId: { type: String, required: true, unique: true },
    title: { type: String },
    description: { type: String },
    category: { type: String },
    mediaType: { type: String, enum: ['video', 'reel', 'thumbnail'], default: 'video' },
    userId: { type: String, ref: 'UserCredentials' },
    views: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    rejectionReason: {
        type: String,
        maxlength: 500
    },
    reviewedBy: {
        type: String,
        ref: 'UserCredentials'
    },
    reviewedAt: {
        type: Date
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
}, {
    timestamps: true,
    _id: false
});

mediaMetadataSchema.plugin(toJSON);
mediaMetadataSchema.plugin(paginate);

// Generate UUID with prefix before saving
mediaMetadataSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('me-');
    }
    next();
});

// Indexes
mediaMetadataSchema.index({ userId: 1 });
mediaMetadataSchema.index({ status: 1 });
mediaMetadataSchema.index({ mediaType: 1 });
mediaMetadataSchema.index({ createdAt: -1 });


const MediaMeta = mongoose.model('mediaMetadata', mediaMetadataSchema);
module.exports = MediaMeta;

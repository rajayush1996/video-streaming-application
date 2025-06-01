const mongoose = require('mongoose');
const utils = require('../utils');
const { toJSON, paginate } = require('./plugins');
const auditPlugin = require('./plugins/audit.plugin');

const mediaMetadataSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => utils.uuid('me-')
    },
    thumbnailId: { 
        type: String, 
        required: [true, 'Thumbnail ID is required'],
        unique: true,
        trim: true
    },
    mediaFileId: { 
        type: String, 
        required: [true, 'Media file ID is required'],
        unique: true,
        trim: true
    },
    title: { 
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: { 
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: { 
        type: String,
        trim: true,
    },
    mediaType: { 
        type: String, 
        enum: {
            values: ['video', 'reel', 'thumbnail'],
            message: '{VALUE} is not a valid media type'
        },
        default: 'video'
    },
    userId: { 
        type: String, 
        ref: 'UserCredentials',
        trim: true
    },
    views: { 
        type: Number, 
        default: 0,
        min: [0, 'Views cannot be negative']
    },
    status: { 
        type: String, 
        enum: {
            values: ['pending', 'approved', 'rejected'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
        trim: true
    },
    reviewedBy: {
        type: String,
        ref: 'UserCredentials',
        trim: true
    },
    reviewedAt: {
        type: Date,
        validate: {
            validator: function(v) {
                return !v || v instanceof Date;
            },
            message: 'Reviewed at must be a valid date'
        }
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },
    deletedAt: { 
        type: Date,
        validate: {
            validator: function(v) {
                return !v || v instanceof Date;
            },
            message: 'Deleted at must be a valid date'
        }
    }
}, {
    timestamps: true,
    _id: false
});

// Remove the strict validation for status-dependent fields since it's admin side
mediaMetadataSchema.plugin(toJSON);
mediaMetadataSchema.plugin(paginate);
mediaMetadataSchema.plugin(auditPlugin, { resourceType: 'MEDIA_METADATA' });

// Indexes
mediaMetadataSchema.index({ userId: 1 });
mediaMetadataSchema.index({ status: 1 });
mediaMetadataSchema.index({ mediaType: 1 });
mediaMetadataSchema.index({ createdAt: -1 });
mediaMetadataSchema.index({ title: 'text', description: 'text' }); // Text search index

const MediaMeta = mongoose.model('mediaMetadata', mediaMetadataSchema);
module.exports = MediaMeta;

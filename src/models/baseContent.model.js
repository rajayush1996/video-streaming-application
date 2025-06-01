const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const auditPlugin = require('./plugins/audit.plugin');
const utils = require('../utils');

const baseContentSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => utils.uuid('cnt-')
    },
    type: {
        type: String,
        enum: ['blog', 'reel', 'video'],
        required: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    author: {
        type: String,
        ref: 'User',
        required: [true, 'Author is required']
    },
    featured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    views: {
        type: Number,
        default: 0,
        min: [0, 'Views cannot be negative']
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    _id: false
});

// Apply plugins
baseContentSchema.plugin(toJSON);
baseContentSchema.plugin(paginate);
baseContentSchema.plugin(auditPlugin, { resourceType: 'CONTENT' });

// Indexes
baseContentSchema.index({ author: 1 });
baseContentSchema.index({ type: 1 });
baseContentSchema.index({ status: 1 });
baseContentSchema.index({ featured: 1 });
baseContentSchema.index({ createdAt: -1 });
baseContentSchema.index({ title: 'text' });

module.exports = baseContentSchema; 
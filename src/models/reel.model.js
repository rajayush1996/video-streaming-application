const mongoose = require('mongoose');
const baseContentSchema = require('./baseContent.model');
const { toJSON, paginate } = require('./plugins');
const auditPlugin = require('./plugins/audit.plugin');
const utils = require('../utils');

const reelSchema = new mongoose.Schema({
    ...baseContentSchema.obj,
    reelSpecific: {
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters']
        },
        duration: {
            type: String,
            required: [true, 'Duration is required'],
            trim: true
        },
        // Media metadata reference
        mediaMetaId: {
            type: String,
            ref: 'MediaMeta',
            required: [true, 'Media metadata is required']
        }
    }
}, {
    timestamps: true,
    _id: false
});

// Generate UUID with prefix before saving
reelSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('r-');
    }
    next();
});

// Add query middleware to exclude soft-deleted reels by default
reelSchema.pre(/^find/, function(next) {
    if (!this.getQuery().includeDeleted) {
        this.where({ deletedAt: null });
    }
    next();
});

// Apply plugins
reelSchema.plugin(toJSON);
reelSchema.plugin(paginate);
reelSchema.plugin(auditPlugin, { resourceType: 'REEL' });

// Add reel-specific indexes
reelSchema.index({ 'reelSpecific.duration': 1 });
reelSchema.index({ 'reelSpecific.mediaMetaId': 1 });

const Reel = mongoose.model('Reel', reelSchema);

module.exports = Reel; 
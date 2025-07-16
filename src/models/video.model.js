const mongoose = require('mongoose');
const baseContentSchema = require('./baseContent.model');
const { toJSON, paginate } = require('./plugins');
const auditPlugin = require('./plugins/audit.plugin');

const videoSchema = new mongoose.Schema({
    ...baseContentSchema.obj,
    videoSpecific: {
        mediaMetaId: {
            type: String,
            ref: 'MediaMeta',
            required: [true, 'Media metadata is required']
        },
        duration: {
            type: String,
            required: [true, 'Duration is required'],
            trim: true
        }
    }
}, {
    timestamps: true,
    _id: false
});


videoSchema.plugin(toJSON);
videoSchema.plugin(paginate);
videoSchema.plugin(auditPlugin, { resourceType: 'Video' });

// Add video-specific indexes
videoSchema.index({ 'videoSpecific.duration': 1 });
videoSchema.index({ 'videoSpecific.mediaMetaId': 1 });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video; 
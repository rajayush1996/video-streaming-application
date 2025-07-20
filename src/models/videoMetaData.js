// models/VideoMetadata.js
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const auditPlugin = require('./plugins/audit.plugin');

const VideoMetadataSchema = new mongoose.Schema({
    // BunnyCDN identifiers
    libraryId:   { type: Number, index: true },
    guid:        { type: String, required: true, unique: true },

    // Basic info
    title:       { type: String },
    description: { type: String },
    category:    { type: String },

    // URLs from BunnyCDN
    videoUrl:    { type: String },
    previewUrl:  { type: String },
    thumbnailUrl:{ type: String },

    // Technical metadata
    lengthSec:        { type: Number },       // video duration in seconds
    framerate:        { type: Number },
    rotation:         { type: Number },
    width:            { type: Number },
    height:           { type: Number },
    availableResolutions: [String], 
    mediaId: { type: String },          // e.g. ['240p','360p','720p']

    // Storage & processing info
    storageSizeBytes: { type: Number },
    outputCodecs:     [String],               // e.g. ['x264']
    encodeProgress:   { type: Number },       // 0–100

    // Timestamps
    dateUploaded:     { type: Date },
    category: { type: String },
    description: { type: String },
    mediaType: { type: String },
}, {
    timestamps: true    // adds createdAt / updatedAt
});

VideoMetadataSchema.plugin(toJSON);
VideoMetadataSchema.plugin(paginate);
VideoMetadataSchema.plugin(auditPlugin, { resourceType: 'MEDIA_METADATA' });


module.exports = mongoose.model('VideoMetadata', VideoMetadataSchema);

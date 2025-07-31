// models/VideoMetadata.js
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const auditPlugin = require('./plugins/audit.plugin');

const VideoMetadataSchema = new mongoose.Schema({
    // BunnyCDN identifiers
    libraryId:   { type: Number, index: true },
    guid:        { type: String, required: true, unique: true },
    visibility: { type: String, required: true, default: true },
    approvedStatus: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    rejectedReason: { type: String },
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
    mediaId: { type: String },   

    // Storage & processing info
    storageSizeBytes: { type: Number },
    outputCodecs:     [String],               // e.g. ['x264']
    encodeProgress:   { type: Number }, 
    
    isDeleted:  { type: Boolean, default: false },// 0–100

    // Timestamps
    dateUploaded:     { type: Date },
    category: { type: String },
    description: { type: String },
    mediaType: { type: String },
    processingStatus: { type: String, enum: ['uploading', 'processing', 'done'] },
    createBy: { type: String, enum: ['admin', 'user', 'creator'] }
}, {
    timestamps: true,   // adds createdAt / updatedAt
    strict: false
});

VideoMetadataSchema.plugin(toJSON);
VideoMetadataSchema.plugin(paginate);
VideoMetadataSchema.plugin(auditPlugin, { resourceType: 'MEDIA_METADATA' });


module.exports = mongoose.model('VideoMetadata', VideoMetadataSchema);

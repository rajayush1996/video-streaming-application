const mongoose = require('mongoose');
const utils = require('../utils');
const { toJSON, paginate } = require('./plugins');

const mediaMetadataSchema = new mongoose.Schema({
    thumbnailId: { type: String, required: true, unique: true },
    mediaFileId:  { type: String, required: true, unique: true },
    title: { type: String },
    description: { type: String },
    category: { type: String },
    mediaType: { type: String, enum: ['video', 'reel', 'thumbnail'], default: 'video' },
    userId: { type: String, ref: 'User' },
    views: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true });

mediaMetadataSchema.plugin(toJSON);
mediaMetadataSchema.plugin(paginate);

// Pre-save hook to hash password before saving user
mediaMetadataSchema.pre('validate', async function (next) {
    const media = this;

    // Generate UUID if _id is not present
    if (!media._id) {
        media._id = utils.uuid('me-');
    }

    next();
});

module.exports = mongoose.model('mediaMetadata', mediaMetadataSchema);

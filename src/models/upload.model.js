const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    blobName: { type: String, required: true },
    containerName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    tags: { type: [String], default: [] },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    status: { type: String, enum: ["uploading", "completed", "failed"], default: "uploading" },
});

module.exports = mongoose.model('FileUpload', fileUploadSchema);
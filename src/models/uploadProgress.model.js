const mongoose = require("mongoose");

const UploadProgressSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    userId: { type: String, required: true },
    mediaType: { type: String, enum: ['video', 'reel'], default: 'video' },
    totalChunks: { type: Number, required: true },
    uploadedChunks: { type: [Number], default: [] }, // Store indexes of uploaded chunks
    status: { type: String, enum: ["in-progress", "completed", "failed"], default: "in-progress" },
    url: { type: String }, // Store the final CDN URL
}, { timestamps: true });

// Compound index for efficient querying
UploadProgressSchema.index({ fileName: 1, userId: 1, mediaType: 1 });

module.exports = mongoose.model("UploadProgress", UploadProgressSchema);

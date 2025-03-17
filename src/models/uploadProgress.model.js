const mongoose = require("mongoose");

const UploadProgressSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    totalChunks: { type: Number, required: true },
    uploadedChunks: { type: [Number], default: [] }, // Store indexes of uploaded chunks
    status: { type: String, enum: ["in-progress", "completed", "failed"], default: "in-progress" },
}, { timestamps: true });

module.exports = mongoose.model("UploadProgress", UploadProgressSchema);

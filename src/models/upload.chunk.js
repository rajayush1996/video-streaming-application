const mongoose = require('mongoose');

const fileChunkSchema = new mongoose.Schema({
    filename: String,
    chunkIndex: Number,
    totalChunks: Number,
    uploaded: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FileChunk', fileChunkSchema);
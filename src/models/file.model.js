const mongoose = require('mongoose');
const { Schema } = mongoose;
const { paginate, toJSON } = require('./plugins');

const FileSchema = new Schema({
    fileId: { type: String, required: true, unique: true },
    blobName: { type: String, required: true },
    containerName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    tags: { type: [String], default: [] },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    url: { type: String }
}, { timestamps: true });

FileSchema.plugin(toJSON);
FileSchema.plugin(paginate);



module.exports = mongoose.model('File', FileSchema);

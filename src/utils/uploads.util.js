const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// In a real application, use a persistent database (MongoDB, PostgreSQL, Redis, etc.)
// This is for demonstration purposes only.
const uploads = {}; // { uploadId: { fileName, totalChunks, uploadedChunks: Set<number>, status, tempPath, finalFilePath } }

const getUploadById = (uploadId) => uploads[uploadId];

const createUpload = (fileName, totalChunks, fileSize) => {
    const uploadId = uuidv4();
    const storageZoneName = require('../../config').cdn.bunny_storage_zone
    const tempUploadPath = `${storageZoneName}/temp_uploads/${uploadId}`;

    uploads[uploadId] = {
        uploadId,
        fileName,
        totalChunks,
        fileSize,
        uploadedChunks: new Set(),
        status: 'initiated',
        tempUploadPath,
        finalFilePath: `${storageZoneName}/uploads/${fileName}`, // Example final path
        createdAt: Date.now(),
    };
    return uploads[uploadId];
};

const markChunkAsUploaded = (uploadId, chunkNumber) => {
    const upload = uploads[uploadId];
    if (upload) {
        upload.uploadedChunks.add(chunkNumber);
    }
};

const updateUploadStatus = (uploadId, status) => {
    const upload = uploads[uploadId];
    if (upload) {
        upload.status = status;
    }
};

const updateUploadByUploadId = (uploadId, updateData) => {
    const upload = uploads[uploadId];
    if (upload) {
        Object.assign(upload, { ...upload, fileDetails: updateData });
    }
};

const getUploadedChunkNumbers = (uploadId) => {
    const upload = uploads[uploadId];
    return upload ? Array.from(upload.uploadedChunks) : [];
};

const deleteUploadState = (uploadId) => {
    delete uploads[uploadId];
};

/**
 * Creates a local temporary directory for reassembly.
 * @param {string} uploadId
 * @returns {string} The path to the created directory.
 */
const createLocalTempDir = (uploadId) => {
    const tempFileDir = path.join(__dirname, '..', '..', 'temp_files', uploadId);
    if (!fs.existsSync(tempFileDir)) {
        fs.mkdirSync(tempFileDir, { recursive: true });
    }
    return tempFileDir;
};

/**
 * Deletes a local temporary directory.
 * @param {string} tempDirPath
 */
const deleteLocalTempDir = (tempDirPath) => {
    if (fs.existsSync(tempDirPath)) {
        fs.rmSync(tempDirPath, { recursive: true, force: true });
    }
};




module.exports = {
    getUploadById,
    createUpload,
    markChunkAsUploaded,
    updateUploadStatus,
    getUploadedChunkNumbers,
    deleteUploadState,
    createLocalTempDir,
    deleteLocalTempDir,
    updateUploadByUploadId
};
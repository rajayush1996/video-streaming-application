const uploadService = require('../services/newUpload.service');

// Wrapper for async handlers to catch errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

class UploadController {
    async initiateUpload(req, res, next) {
        try {
            const { fileName, totalChunks, fileSize } = req.body;
            if (!fileName || totalChunks === undefined || fileSize === undefined) {
                return res.status(400).json({ message: 'Missing required fields: fileName, totalChunks, fileSize' });
            }

            const upload = uploadService.initiateUpload(fileName, totalChunks, fileSize);
            res.status(200).json({ uploadId: upload.uploadId, tempUploadPath: upload.tempUploadPath });
        } catch (error) {
            console.log("🚀 ~ UploadController ~ initiateUpload ~ error:", error)
            next(error); // Pass error to Express error handler middleware
        }
    }

    async getUploadStatus(req, res, next) {
        try {
            const { uploadId } = req.params;
            const status = uploadService.getUploadStatus(uploadId);
            if (!status) {
                return res.status(404).json({ message: 'Upload not found.' });
            }
            res.status(200).json(status);
        } catch (error) {
            next(error);
        }
    }

    async uploadChunk(req, res, next) {
        try {
            const { uploadId, chunkNumber } = req.params;
            const chunkData = req.body; // Raw binary data
            console.log('Chunk Size:', req.body?.length);
            console.log('Is Buffer:', Buffer.isBuffer(req.body));

            // Basic validation for chunkNumber
            const parsedChunkNumber = parseInt(chunkNumber, 10);
            if (isNaN(parsedChunkNumber) || parsedChunkNumber < 0) {
                return res.status(400).json({ message: 'Invalid chunk number.' });
            }

            // The service handles checking if the chunk was already uploaded
            await uploadService.uploadChunk(uploadId, parsedChunkNumber, chunkData);
            res.status(200).json({ message: 'Chunk uploaded successfully' });
        } catch (error) {
            next(error);
        }
    }

    async completeUpload(req, res, next) {
        try {
            const { uploadId } = req.params;
            const downloadFilesDetails = await uploadService.finalizeUpload(uploadId);
            res.status(200).json({
                message: 'File uploaded and finalized successfully!',
                filesDetails: downloadFilesDetails
            });
        } catch (error) {
            next(error);
        }
    }

    async uploadImage(req, res, next) {
        try {
            // Assuming 'file' or 'thumbnail' is the name of the input field in FormData
            // Adjust 'thumbnail' to match your frontend's FormData append name
            const uploadedFile = req.files && (req.files.thumbnail || req.files.image || req.files.file); // Flexible
            const { fileName, mediaType } = req.body; // Expecting fileName and mediaType from frontend

            if (!uploadedFile) {
                return res.status(400).json({ message: 'No file uploaded.' });
            }
            if (!fileName || !mediaType) {
                return res.status(400).json({ message: 'Missing fileName or mediaType in request body.' });
            }

            const fileInfo = await uploadService.uploadImage(uploadedFile, fileName, mediaType);
            res.status(200).json({
                message: 'Image uploaded successfully!',
                fileDetails: fileInfo // Send back the public URL
            });
        } catch (error) {
            next(error);
        }
    }
}

// Export an instance of the controller with asyncHandler wrappers
module.exports = {
    initiateUpload: asyncHandler(new UploadController().initiateUpload),
    getUploadStatus: asyncHandler(new UploadController().getUploadStatus),
    uploadChunk: asyncHandler(new UploadController().uploadChunk),
    completeUpload: asyncHandler(new UploadController().completeUpload),
    uploadImage: asyncHandler(new UploadController().uploadImage),
};
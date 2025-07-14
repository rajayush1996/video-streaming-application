const uploadUtils = require('../utils/uploads.util');
const bunnycdnUtils = require('../utils/bunny.utils');
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const fileSchema = require("../models/file.model");
const utils = require('../utils');


// const { PULL_ZONE_HOSTNAME, STORAGE_ZONE_NAME } = require('../config/bunnycdn.config');

const PULL_ZONE_HOSTNAME = config.cdn.bunny_pull_zone;
const STORAGE_ZONE_NAME = config.cdn.bunny_storage_zone;

class UploadService {
    /**
     * Initiates a new file upload.
     * @param {string} fileName
     * @param {number} totalChunks
     * @param {number} fileSize
     * @returns {object} The new upload state.
     */
    initiateUpload(fileName, totalChunks, fileSize) {
        const upload = uploadUtils.createUpload(fileName, totalChunks, fileSize);
        // console.log(`Service: Upload initiated: ${upload.uploadId} for ${fileName}`);
        return upload;
    }

    /**
     * Gets the current status of an upload.
     * @param {string} uploadId
     * @returns {object|null} The upload state or null if not found.
     */
    getUploadStatus(uploadId) {
        const upload = uploadUtils.getUploadById(uploadId);
        // console.log("🚀 ~ UploadService ~ getUploadStatus ~ upload:", upload);
        if (!upload) return null;
        if(upload.status === 'completed') {
            return {
                uploadId: upload.uploadId,
                fileName: upload.fileName,
                totalChunks: upload.totalChunks,
                uploadedChunks: uploadUtils.getUploadedChunkNumbers(uploadId), // Convert Set to Array
                status: upload.status,
                fileSize: upload.fileSize,
                downloadUrl: upload.fileDetails?.url || null,
                fileDetails: upload.fileDetails || null,
            }
        }
        return {
            uploadId: upload.uploadId,
            fileName: upload.fileName,
            totalChunks: upload.totalChunks,
            uploadedChunks: uploadUtils.getUploadedChunkNumbers(uploadId), // Convert Set to Array
            status: upload.status,
            fileSize: upload.fileSize
        };
    }

    /**
     * Processes and uploads a single chunk.
     * @param {string} uploadId
     * @param {number} chunkNumber
     * @param {Buffer} chunkData
     * @returns {Promise<void>}
     */
    async uploadChunk(uploadId, chunkNumber, chunkData) {
        const upload = uploadUtils.getUploadById(uploadId);
        if (!upload) {
            throw new Error('Upload not found.');
        }

        if (upload.uploadedChunks.has(chunkNumber)) {
            // console.log(`Service: Chunk ${chunkNumber} for ${uploadId} already exists. Skipping upload.`);
            return; // Idempotent: do nothing if chunk already exists
        }

        const chunkBunnyPath = `${upload.tempUploadPath}/chunk_${chunkNumber}.part`;
        await bunnycdnUtils.uploadToBunnyCDN(chunkData, chunkBunnyPath);
        uploadUtils.markChunkAsUploaded(uploadId, chunkNumber);
        // console.log(`Service: Chunk ${chunkNumber} for ${uploadId} uploaded successfully.`);
    }

    /**
     * Finalizes the upload by reassembling chunks and moving the file.
     * @param {string} uploadId
     * @returns {Promise<string>} The final download URL.
     */
    async finalizeUpload(uploadId) {
        const upload = uploadUtils.getUploadById(uploadId);
        if (!upload) {
            throw new Error('Upload not found.');
        }

        // It's crucial to ensure all chunks are accounted for before proceeding
        if (upload.uploadedChunks.size !== upload.totalChunks) {
            throw new Error('Not all chunks have been uploaded yet. Please ensure all chunks are reported as uploaded.');
        }

        uploadUtils.updateUploadStatus(uploadId, 'finalizing');
        // console.log(`Service: Finalizing upload ${uploadId}...`);

        let localTempFileDir = null;
        let localFinalFilePath = null; // Declare here for broader scope
        try {
            // 1. Create a local temporary directory for reassembly
            localTempFileDir = uploadUtils.createLocalTempDir(uploadId);
            localFinalFilePath = path.join(localTempFileDir, upload.fileName);
            const writeStream = fs.createWriteStream(localFinalFilePath);

            // Create a Promise that resolves when the writeStream finishes or rejects on error
            const writeStreamPromise = new Promise((resolve, reject) => {
                writeStream.on('finish', () => {
                    // console.log(`Service: writeStream finished for ${localFinalFilePath}`);
                    resolve();
                });
                writeStream.on('error', (err) => {
                    console.error(`Service: writeStream error for ${localFinalFilePath}:`, err);
                    reject(err);
                });
            });

            // 2. Download chunks from BunnyCDN and reassemble locally
            const allChunks = Array.from(upload.uploadedChunks).sort((a, b) => a - b);
            for (const chunkNum of allChunks) {
                const chunkBunnyPath = `${upload.tempUploadPath}/chunk_${chunkNum}.part`;
                // console.log(`Service: Downloading chunk ${chunkNum} from BunnyCDN path: ${chunkBunnyPath}`);
                console.log("🚀 ~ UploadService ~ finalizeUpload ~ chunkBunnyPath:", chunkBunnyPath);

                const chunkBuffer = await bunnycdnUtils.downloadFromBunnyCDN(chunkBunnyPath);

                // --- IMPORTANT CHECK HERE ---
                if (!chunkBuffer || chunkBuffer.length === 0) {
                    console.warn(`Service: Downloaded chunk ${chunkNum} from ${chunkBunnyPath} is empty or null.`);
                    // Consider making this a fatal error if an empty chunk means a corrupted file
                    throw new Error(`Downloaded chunk ${chunkNum} is empty. Cannot reassemble.`);
                }
                // console.log(`Service: Downloaded chunk ${chunkNum} size: ${chunkBuffer.length} bytes`); // <-- THIS IS THE KEY LOG
                // --- END IMPORTANT CHECK ---

                // Write the chunk buffer to the local file stream
                if (!writeStream.write(chunkBuffer)) {
                    // console.log(`Service: Backpressure detected for chunk ${chunkNum}. Waiting for 'drain' event.`);
                    await new Promise(resolve => writeStream.once('drain', resolve));
                    // console.log(`Service: 'Drain' event received for chunk ${chunkNum}.`);
                }
                // console.log(`Service: Chunk ${chunkNum} written to local stream.`);
            }

            // After writing all chunks, end the stream.
            // IMPORTANT: Ensure all writes are done before calling .end()
            writeStream.end();
            // console.log(`Service: All chunks written to stream, waiting for stream to finish...`);


            // Await the promise for the writeStream to truly finish
            await writeStreamPromise;

            // console.log(`Service: File ${upload.fileName} reassembled locally at ${localFinalFilePath}.`);

            // 3. Upload the reassembled file to its final BunnyCDN location
            // Check if the local file exists and has content before reading
            const stats = fs.statSync(localFinalFilePath);
            if (stats.size === 0) {
                console.error(`Service: Reassembled local file ${localFinalFilePath} is 0 bytes!`);
                throw new Error(`Reassembled local file is empty. Check chunk downloading/writing.`);
            }

            const finalFileBuffer = fs.readFileSync(localFinalFilePath);
            // console.log(`Service: Reassembled file buffer size: ${finalFileBuffer.length} bytes`); // DEBUG: confirm size

            const finalBunnyPath = upload.finalFilePath; // e.g., myZone/uploads/fileName.ext

            await bunnycdnUtils.uploadToBunnyCDN(finalFileBuffer, finalBunnyPath);
            // console.log(`Service: Final file uploaded to BunnyCDN: ${finalBunnyPath}`);

            // 4. Cleanup temporary chunks on BunnyCDN and local temp files
            const bunnyTempDirToDelete = `${upload.tempUploadPath}/`; // Ensure trailing slash for directory deletion
            await bunnycdnUtils.deleteFromBunnyCDN(bunnyTempDirToDelete); // Delete the temporary folder on BunnyCDN
            // console.log(`Service: Deleted temporary BunnyCDN directory: ${bunnyTempDirToDelete}`);

            uploadUtils.deleteLocalTempDir(localTempFileDir); // Delete local temp folder
            // console.log(`Service: Deleted local temporary directory: ${localTempFileDir}`);

            uploadUtils.updateUploadStatus(uploadId, 'completed');

            const relativePath = finalBunnyPath.replace(`${STORAGE_ZONE_NAME}/`, '');
            const downloadUrl = `${PULL_ZONE_HOSTNAME}/${relativePath}`; // Ensure HTTPS if your Pull Zone uses it
            const timestamp = Date.now();
            const fileDetails = await fileSchema.create({
                fileId: timestamp,
                blobName: upload.fileName,
                containerName: 'videos/reels',
                originalName: upload.fileName || new Date(),
                mimeType: "application/octet-stream",
                size: finalFileBuffer.length,
                tags: [],
                visibility: "public",
                url : downloadUrl,
            })
            const files = fileDetails.toObject();

            // console.log(`Service: Final download URL: ${downloadUrl}`);
            uploadUtils.updateUploadByUploadId(uploadId, files);
            return { downloadUrl, fileDetails };

        } catch (error) {
            uploadUtils.updateUploadStatus(uploadId, 'failed');
            uploadUtils.deleteUploadState(uploadId); // Clean up even on failure
            if (localTempFileDir) {
                uploadUtils.deleteLocalTempDir(localTempFileDir); // Ensure local cleanup on failure
                // console.log(`Service: Cleaned up local temp dir on error: ${localTempFileDir}`);
            }
            console.error(`Service: Error during finalization for ${uploadId}:`, error);
            // Re-throw the error to be caught by the controller/global error handler
            throw new Error(`File finalization failed: ${error.message}`);
        }
    }

    /**
     * Uploads an image file directly to BunnyCDN.
     * Assumes file is handled by express-fileupload and available in req.files.
     * @param {object} file - The file object from req.files (e.g., req.files.thumbnail).
     * @param {string} fileName - The desired file name on BunnyCDN (e.g., my-image.jpg).
     * @param {string} mediaType - 'thumbnail' or 'image' to determine path.
     * @returns {Promise<string>} The final download URL for the image.
     */
    async uploadImage(file, fileName, mediaType) {
        // console.log("🚀 ~ UploadService ~ uploadImage ~ file:", file)
        if (!file || !file.data) {
            throw new Error('No image data provided for upload.');
        }

        let bunnyBasePath;
        if (mediaType === 'thumbnail') {
            bunnyBasePath = `${STORAGE_ZONE_NAME}/thumbnails`;
        } else if (mediaType === 'image') {
            bunnyBasePath = `${STORAGE_ZONE_NAME}/images`;
        } else {
            throw new Error('Invalid mediaType for image upload.');
        }

        const fullBunnyPath = `${bunnyBasePath}/${fileName}`;

        try {
            // file.data is a Buffer when using express-fileupload
            await bunnycdnUtils.uploadToBunnyCDN(file.data, fullBunnyPath);
            // console.log(`Service: Image uploaded successfully to BunnyCDN: ${fullBunnyPath}`);
            const timestamp = Date.now();
            // Construct and return the public URL
            const downloadUrl = `${PULL_ZONE_HOSTNAME}/${fullBunnyPath.replace(`${STORAGE_ZONE_NAME}/`, '')}`;
            const fileDetails = await fileSchema.create({
                fileId: timestamp,
                blobName: file.name,
                containerName: mediaType,
                originalName: file.name || new Date(),
                mimeType: file.mimeType || "application/octet-stream",
                size: file.size,
                tags: [],
                visibility: "public",
                url : downloadUrl,
            })
            return { downloadUrl , file: fileDetails };

        } catch (error) {
            console.error(`Service: Failed to upload image ${fileName}:`, error);
            throw new Error(`Image upload failed: ${error.message}`);
        }
    }

}

module.exports = new UploadService(); // Export an instance of the service
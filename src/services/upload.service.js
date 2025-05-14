const axios = require("axios");
const fs = require("fs");
const config = require('../../config');
const path = require("path");
const fileSchema = require("../models/file.model");
const sanitizeFilename = require("sanitize-filename");
const UploadProgress = require("../models/uploadProgress.model");

// const BUNNY_STORAGE_URL = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}`;
const BUNNY_STORAGE_URL = `${config.cdn.bunny_storage_host}/${config.cdn.bunny_storage_zone}`;

const ACCESS_KEY = config.cdn.bunny_access_key;

const PULL_ZONE = config.cdn.bunny_pull_zone;
const VID_CONTAINER_NAME = config.cdn.bunny_cdn_vid_container_name;
const THUMBNAIL_CONTAINER_NAME = config.cdn.bunny_cdn_thumbnail_container_name;

/**
 * Upload a chunk to BunnyCDN
 * @param {string} filePath - The local chunk path
 * @param {string} filename - The file name in BunnyCDN
 * @param {boolean} isFirstChunk - If true, overwrites existing file
 * @returns {Promise<void>}
 */
exports.uploadChunk = async (filePath, filename, isFirstChunk) => {
    try {
        const fullUrl = `${BUNNY_STORAGE_URL}/${filename}`;
    
        // Read the chunk
        const fileStream = fs.createReadStream(filePath);
    
        // BunnyCDN requires overwrite for first chunk
        const headers = {
            "AccessKey": ACCESS_KEY,
            "Content-Type": "application/octet-stream",
            "Content-Range": `bytes */*`,
        };
    
        if (!isFirstChunk) {
            headers["Bunny-Append-File"] = "true"; // Append to existing file
        }

        await axios.put(fullUrl, fileStream, { headers });

        console.log(`✅ Chunk uploaded: ${filename}`);
    } catch (error) {
        console.error("BunnyCDN Chunk Upload Failed:", error.response?.data || error.message);
        throw new Error("Chunk upload failed.");
    }
};


exports.uploadToBunnyCDN =async (filePath, fileName, options={}) =>{
    try {
        // ✅ Ensure the merged file actually exists before attempting upload
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        let containerName = VID_CONTAINER_NAME;
        if(options.type === 'thumbnail') {
            containerName = THUMBNAIL_CONTAINER_NAME;
        }

        const fileStream = fs.createReadStream(filePath);
        const uploadUrl = `${BUNNY_STORAGE_URL}/${containerName}/${fileName}`;

        await axios.put(uploadUrl, fileStream, {
            headers: {
                AccessKey: ACCESS_KEY,
                "Content-Type": "application/octet-stream",
            },
            maxBodyLength: Infinity,
        });

        const stats = fs.statSync(filePath);
        const url = `${PULL_ZONE}/${containerName}/${fileName}`;

        const saved = await fileSchema.create({
            fileId: path.parse(fileName).name,
            blobName: fileName,
            containerName: containerName,
            originalName: options.originalName || fileName,
            mimeType: options.mimeType || "application/octet-stream",
            size: stats.size,
            tags: options.tags || [],
            visibility: options.visibility || "public",
            url,
        });
        return { url, file: saved };;
    } catch (error) {
        throw new Error(`BunnyCDN Upload Failed: ${error.message}`);
    }
}

/**
 * Handle thumbnail upload
 * @param {Object} thumbnail - The thumbnail file object
 * @param {string} fileName - The filename to use
 * @param {string} userId - The ID of the user uploading
 * @returns {Promise<Object>} - The upload result with thumbnail URL
 */
exports.handleThumbnailUpload = async (thumbnail, fileName, userId = 'anonymous') => {
    try {
        // Ensure the upload directory exists
        const uploadDir = path.join(__dirname, config.cdn.local_upload_path);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
  
        // Create unique file path
        const uniqueDate = Date.now(); // more unique than just milliseconds
        const rawFileName = `thumb_${fileName}`;
        const thumbPath = path.join(uploadDir, rawFileName);
  
        // Save file temporarily
        await thumbnail.mv(thumbPath);
  
        // Upload to BunnyCDN
        const thumbUrl = await exports.uploadToBunnyCDN(
            thumbPath,
            `thumb_${fileName}_${uniqueDate}`, 
            { 
                type: 'thumbnail',
                userId,
                originalName: fileName
            }
        );
  
        // Clean up local temp file
        fs.unlinkSync(thumbPath);
  
        return { message: "Thumbnail uploaded successfully!", thumbUrl };
  
    } catch (err) {
        console.error("❌ Thumbnail upload error:", err);
        throw new Error('Failed to upload thumbnail');
    }
};

/**
 * Process a video chunk upload
 * @param {Object} chunk - The chunk file object
 * @param {string} fileName - The filename
 * @param {number} chunkIndex - The index of the current chunk
 * @param {number} totalChunks - Total number of chunks
 * @param {string} userId - The ID of the user uploading
 * @param {string} mediaType - Type of media (video/reel)
 * @returns {Promise<Object>} - The upload result
 */
exports.processVideoChunk = async (chunk, fileName, chunkIndex, totalChunks, userId = 'anonymous', mediaType = 'video') => {
    try {
        const uploadDir = path.join(__dirname, config.cdn.local_upload_path);
        fileName = sanitizeFilename(fileName.replace(/\s+/g, "_")); // Sanitize filename

        // Ensure the upload directory exists
        if (!fs.existsSync(uploadDir)) {
            console.log(`Creating upload directory: ${uploadDir}`);
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const chunkPath = path.join(uploadDir, `${fileName}.part${chunkIndex}`);
        console.log(`🚀 Saving chunk to: ${chunkPath}`);
        await chunk.mv(chunkPath);

        // Check if chunk is valid
        if (!chunk) {
            console.error(`❌ Chunk is undefined or empty for chunkIndex: ${chunkIndex}`);
            throw new Error(`Invalid chunk data for chunkIndex: ${chunkIndex}`);
        }

        // Save chunk to disk
        // try {
        
        //     console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} saved successfully.`);
        // } catch (error) {
        //     console.error(`❌ Failed to save chunk ${chunkIndex + 1}/${totalChunks}:`, error);
        //     throw new Error(`Failed to save chunk ${chunkIndex + 1}/${totalChunks}`);
        // }

        // Find or create upload progress record
        let progress = await UploadProgress.findOne({ fileName, userId, mediaType });
        if (!progress) {
            progress = new UploadProgress({
                fileId: Date.now().toString(),
                fileName,
                userId,
                mediaType,
                totalChunks,
                uploadedChunks: [],
                status: "in-progress",
            });
            await progress.save();
        }

        // Update progress
        if (!progress.uploadedChunks.includes(chunkIndex)) {
            progress.uploadedChunks.push(chunkIndex);
            await progress.save();
        } else {
            console.log(`⚠️ Chunk ${chunkIndex} already uploaded. Skipping.`);
        }

        // If all chunks are uploaded, merge and upload to BunnyCDN
        if (progress.uploadedChunks.length === totalChunks) {
            return await exports.mergeAndUploadChunks(fileName, totalChunks, uploadDir, userId, mediaType);
        }

        return {
            message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully.`,
            chunkFile: chunkPath,
        };
    } catch (error) {
        console.error(`❌ Error in processVideoChunk:`, error);
        throw error;
    }
};

/**
 * Merge all chunks and upload the final file
 * @param {string} fileName - The filename
 * @param {number} totalChunks - Total number of chunks
 * @param {string} uploadDir - The upload directory
 * @param {string} userId - The ID of the user uploading
 * @param {string} mediaType - Type of media (video/reel)
 * @returns {Promise<Object>} - The upload result
 */
exports.mergeAndUploadChunks = async (fileName, totalChunks, uploadDir, userId, mediaType) => {
    console.log(`Merging chunks for ${fileName}...`);
    
    const finalFilePath = path.join(uploadDir, fileName);
    const writeStream = fs.createWriteStream(finalFilePath);
    const chunkFiles = []; // Keep track of chunk files
    
    for (let i = 0; i < totalChunks; i++) {
        const chunkFile = path.join(uploadDir, `${fileName}.part${i}`);
        chunkFiles.push(chunkFile); // Store chunk file path
        
        console.log("🚀 ~ exports.mergeAndUploadChunks= ~ chunkFile:", chunkFile);
        if (!fs.existsSync(chunkFile)) {
            console.error(`Missing chunk: ${chunkFile}`);
            throw new Error("Missing chunk file");
        }
        
        const data = fs.readFileSync(chunkFile);
        writeStream.write(data);
    }
    
    writeStream.end();
    
    await new Promise((resolve) => writeStream.on("finish", resolve));
    console.log(`✅ Merged file saved: ${finalFilePath}`);
    
    // Upload the final merged file to BunnyCDN
    try {
        console.log("Uploading merged file to BunnyCDN...");
        const result = await exports.uploadToBunnyCDN(finalFilePath, fileName, {
            userId,
            mediaType,
            originalName: fileName
        });
        
        // Only delete chunks after successful upload
        for (const chunkFile of chunkFiles) {
            if (fs.existsSync(chunkFile)) {
                fs.unlinkSync(chunkFile);
            }
        }
        
        // Update progress status
        await UploadProgress.findOneAndUpdate(
            { fileName, userId, mediaType },
            { status: "completed", url: result.url }
        );
        
        return { 
            message: "File uploaded successfully!", 
            url: result.url,
            file: result.file,
            finalFilePath
        };
    } catch (error) {
        console.error("Final upload failed:", error);
        throw error;
    }
};

/**
 * Handle profile image upload (avatar or cover)
 * @param {Object} file - The file object from request
 * @param {string} type - Type of image ('avatar' or 'cover')
 * @param {string} userId - The ID of the user uploading
 * @returns {Promise<Object>} - The upload result with image URL
 */
exports.handleProfileImageUpload = async (file, type, userId) => {
    try {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error('Invalid file type. Only images are allowed');
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            throw new Error('File size too large. Maximum size is 5MB');
        }

        // Ensure the upload directory exists
        const uploadDir = path.join(__dirname, config.cdn.local_upload_path);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Create unique filename
        const timestamp = Date.now();
        const fileName = `${type}_${userId}_${timestamp}${path.extname(file.name)}`;
        const filePath = path.join(uploadDir, fileName);

        // Save file temporarily
        await file.mv(filePath);

        // Upload to BunnyCDN
        const result = await exports.uploadToBunnyCDN(
            filePath,
            fileName,
            {
                type: 'thumbnail', // Using thumbnail container for profile images
                userId,
                originalName: file.name,
                mimeType: file.mimetype,
                tags: [type, 'profile']
            }
        );

        // Clean up local temp file
        fs.unlinkSync(filePath);

        return {
            message: `${type} uploaded successfully!`,
            url: result.url,
            file: result.file
        };

    } catch (err) {
        console.error(`❌ ${type} upload error:`, err);
        throw new Error(`Failed to upload ${type}`);
    }
};


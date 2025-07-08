const uploadProgressModel = require("../models/uploadProgress.model");
const uploadService = require("../services/upload.service");
const { handleThumbnailUpload, processVideoChunk } = uploadService;
const fs = require('fs');

const uploadVideo = async (req, res) => {
  try {
    console.log("Incoming upload request:", req.body);

    let { fileName, chunkIndex, totalChunks, isThumbnail } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "Missing fileName" });
    }

    const userId = req.user?.id || 'anonymous';

    // Handle Thumbnail Upload
    if (isThumbnail === 'true') {
      if (!req.files || !req.files.thumbnail) {
        return res.status(400).json({ error: "No thumbnail file provided" });
      }

      const result = await handleThumbnailUpload(req.files.thumbnail, fileName, userId);
      return res.json(result);
    }

    // Handle Video Chunk Upload
    if (!req.files || !req.files.chunk) {
      return res.status(400).json({ error: "No file chunk provided" });
    }

    // Parse integers properly
    chunkIndex = parseInt(chunkIndex);
    totalChunks = parseInt(totalChunks);

    // Process the current chunk
    const result = await processVideoChunk(
      req.files.chunk,
      fileName,
      chunkIndex,
      totalChunks,
      userId,
      'video'
    );

    // Don't delete final file here! Already handled in merge/upload logic
    return res.json(result);

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: error.message || "Upload failed" });
  }
};


/**
 * API to get the progress of an ongoing file upload.
 * It returns the already uploaded chunk indexes.
 */
const getUploadProgress = async (req, res) => {
    try {
        const { fileName } = req.query;

        if (!fileName) {
            return res.status(400).json({ error: "fileName query parameter is required" });
        }

        const progress = await uploadProgressModel.findOne({ fileName });

        if (!progress) {
            return res.json({ uploadedChunks: [] }); // No progress means no chunks uploaded
        }

        res.json({ uploadedChunks: progress.uploadedChunks });
    } catch (error) {
        console.error("Error fetching upload progress:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * @swagger
 * /api/v1/upload/reels:
 *   post:
 *     summary: Upload a new reel
 *     tags: [Upload]
 *     description: Uploads a reel file with a thumbnail
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *             required:
 *               - video
 *               - thumbnail
 *     responses:
 *       '200':
 *         description: Reel uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 fileName:
 *                   type: string
 *       '400':
 *         description: Missing required files
 *       '500':
 *         description: Server error during upload
 */
const uploadReel = async (req, res) => {
    try {
        console.log("📥 Incoming reel upload:", req.body);
  
        let { fileName, chunkIndex, totalChunks, isThumbnail } = req.body;
  
        // Thumbnail Upload
        if (isThumbnail === 'true') {
            if (!req.files || !req.files.thumbnail) {
                return res.status(400).json({ error: "No thumbnail file provided" });
            }
  
            const userId = req.user?.id || 'anonymous'; // fallback if auth isn't mandatory
            const result = await uploadService.handleThumbnailUpload(req.files.thumbnail, fileName, userId);
            return res.json(result);
        }
  
        // ✅ Reel Chunk Upload
        if (!req.files || !req.files.chunk) {
            return res.status(400).json({ error: "No file chunk provided" });
        }
  
        chunkIndex = parseInt(chunkIndex);
        totalChunks = parseInt(totalChunks);
  
        const userId = req.user?.id || 'anonymous'; // fallback if auth isn't mandatory
  
        const result = await uploadService.processVideoChunk(
            req.files.chunk,
            fileName,
            chunkIndex,
            totalChunks,
            userId,
            'reel' // ✅ Default media type
        );
  
        // Clean up chunks after merging
        fs.unlinkSync(result.chunkFile);
        // Clean up final file after upload
        fs.unlinkSync(result.finalFilePath);
  
        return res.json(result);
    } catch (error) {
        console.error("❌ Reel upload error:", error);
        return res.status(500).json({ error: error.message || "Reel upload failed" });
    }
};
  

module.exports = {
    uploadVideo,
    getUploadProgress,
    uploadReel,
};

const uploadProgressModel = require("../models/uploadProgress.model");
const { handleThumbnailUpload, processVideoChunk } = require("../services/upload.service");

exports.uploadVideo = async (req, res) => {
    try {
        console.log("📥 Incoming upload request:", req.body);

        let { fileName, chunkIndex, totalChunks, isThumbnail } = req.body;

        // ✅ Thumbnail Upload
        if (isThumbnail === 'true') {
            if (!req.files || !req.files.thumbnail) {
                return res.status(400).json({ error: "No thumbnail file provided" });
            }
  
            const result = await handleThumbnailUpload(req.files.thumbnail, fileName);
            return res.json(result);
        }

        if (!req.files || !req.files.chunk) {
            return res.status(400).json({ error: "No file chunk provided" });
        }   
        
        chunkIndex = parseInt(chunkIndex);
        totalChunks = parseInt(totalChunks);
        
        const result = await processVideoChunk(req.files.chunk, fileName, chunkIndex, totalChunks);
        return res.json(result);
    } catch (error) {
        console.error("❌ Upload error:", error);
        return res.status(500).json({ error: error.message || "Upload failed" });
    }
};

/**
 * API to get the progress of an ongoing file upload.
 * It returns the already uploaded chunk indexes.
 */
exports.getUploadProgress = async (req, res) => {
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
        console.error("❌ Error fetching upload progress:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

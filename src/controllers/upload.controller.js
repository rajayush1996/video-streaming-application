const uploadService = require('../services/upload.service')

exports.initUpload = async (req, res) => {
    try {
        const { filename, totalSize } = req.body;
        if (!filename || !totalSize) {
            return res.status(400).json({ error: "Filename and total size are required." });
        }
  
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB Chunk Size Decided in Backend
        const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
        const uploadSessionId = `${Date.now()}-${filename}`;
  
        res.json({
            message: "Upload Initialized",
            chunkSize: CHUNK_SIZE,
            totalChunks,
            uploadSessionId,
            filename,
        });
    } catch (error) {
        res.status(500).json({ error: "Error initializing upload." });
    }
};
  
exports.uploadChunk = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  
        const { uploadSessionId, totalChunks, chunkIndex, filename } = req.body;
        if (!uploadSessionId || !totalChunks || !chunkIndex) {
            return res.status(400).json({ error: "Invalid upload session." });
        }
  
        const filePath = req.file.path;
        const isFirstChunk = parseInt(chunkIndex) === 0;
  
        // Upload chunk to BunnyCDN
        await uploadService.uploadChunk(filePath, filename, isFirstChunk);
  
        fs.unlinkSync(filePath); // Remove chunk after upload
  
        const isLastChunk = parseInt(chunkIndex) === parseInt(totalChunks) - 1;
  
        if (isLastChunk) {
            return res.json({
                message: "Upload completed!",
                videoUrl: `${process.env.BUNNY_CDN_PULL_ZONE}/${filename}`,
            });
        }
  
        res.json({ message: `Chunk ${chunkIndex} uploaded.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
  
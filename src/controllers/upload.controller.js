const fs = require("fs");
const path = require("path");
const sanitizeFilename = require("sanitize-filename");
const UploadProgress = require("../models/uploadProgress.model");
const { uploadToBunnyCDN } = require("../services/upload.service");

exports.uploadVideo = async (req, res) => {
    try {
        console.log("📥 Incoming upload request:", req.body);

        

        let { fileName, chunkIndex, totalChunks, isThumbnail } = req.body;
        const uploadDir = path.join(__dirname, "../../uploads");

        // ✅ Thumbnail Upload
        if (isThumbnail === 'true') {
            if (!req.files || !req.files.thumbnail) {
                return res.status(400).json({ error: "No thumbnail file provided" });
            }
  
            const thumbnail = req.files.thumbnail;
            const thumbPath = path.join(uploadDir, `thumb_${fileName}`);
  
            await thumbnail.mv(thumbPath);
            const thumbUrl = await uploadToBunnyCDN(thumbPath, `thumb_${fileName}`);
            fs.unlinkSync(thumbPath);
  
            return res.json({ message: "Thumbnail uploaded successfully!", thumbUrl });
        }

        if (!req.files || !req.files.chunk) {
            return res.status(400).json({ error: "No file chunk provided" });
        }   
        chunkIndex = parseInt(chunkIndex);
        totalChunks = parseInt(totalChunks);
        fileName = sanitizeFilename(fileName.replace(/\s+/g, "_")); // ✅ Sanitize filename

        
        const chunk = req.files.chunk;
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const chunkPath = path.join(uploadDir, `${fileName}.part${chunkIndex}`);

        // ✅ Find or create upload progress record
        let progress = await UploadProgress.findOne({ fileName });

        if (!progress) {
            progress = new UploadProgress({
                fileId: Date.now().toString(),
                fileName,
                totalChunks,
                uploadedChunks: [],
                status: "in-progress",
            });
            await progress.save();
        }

        if (progress.uploadedChunks.includes(chunkIndex)) {
            console.log(`⚠️ Chunk ${chunkIndex} already uploaded. Skipping.`);
            return res.json({ message: `Chunk ${chunkIndex + 1}/${totalChunks} already uploaded.` });
        }

        // ✅ Save chunk to disk
        await chunk.mv(chunkPath);
        console.log(`✅ Received chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`);

        // ✅ Update MongoDB with uploaded chunk info
        progress.uploadedChunks.push(chunkIndex);
        await progress.save();

        console.log("🚀 ~ exports.uploadVideo= ~ progress.uploadedChunks.length:", progress.uploadedChunks.length)
        // ✅ If all chunks are uploaded, merge and upload to BunnyCDN
        if (progress.uploadedChunks.length === totalChunks) {
            console.log(`🔄 Merging chunks for ${fileName}...`);

            const finalFilePath = path.join(uploadDir, fileName);
            const writeStream = fs.createWriteStream(finalFilePath);

            for (let i = 0; i < totalChunks; i++) {
                const chunkFile = path.join(uploadDir, `${fileName}.part${i}`);
                
                if (!fs.existsSync(chunkFile)) {
                    console.error(`❌ Missing chunk: ${chunkFile}`);
                    return res.status(500).json({ error: "Missing chunk file" });
                }

                const data = fs.readFileSync(chunkFile);
                writeStream.write(data);
                fs.unlinkSync(chunkFile); // ✅ Remove chunk after merging
            }

            writeStream.end();

            await new Promise((resolve) => writeStream.on("finish", resolve));
            console.log(`✅ Merged file saved: ${finalFilePath}`);

            // ✅ Upload the final merged file to BunnyCDN
            try {
                console.log("🚀 Uploading merged file to BunnyCDN...");
                const bunnyUrl = await uploadToBunnyCDN(finalFilePath, fileName);
                console.log("🚀 ~ exports.uploadVideo= ~ bunnyUrl:", bunnyUrl)
                fs.unlinkSync(finalFilePath); // ✅ Remove after successful upload

                // ✅ Mark upload as completed in MongoDB
                progress.status = "completed";
                await progress.save();

                console.log("✅ Upload to BunnyCDN successful:", bunnyUrl);
                return res.json({ message: "File uploaded successfully!", bunnyUrl });
            } catch (error) {
                console.error("❌ Failed to upload to BunnyCDN:", error);
                return res.status(500).json({ error: "Failed to upload to BunnyCDN" });
            }
        }

        res.json({ message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded.` });

    } catch (error) {
        console.error("❌ Upload error:", error);
        res.status(500).json({ error: "Internal server error" });
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

        const progress = await UploadProgress.findOne({ fileName });

        if (!progress) {
            return res.json({ uploadedChunks: [] }); // No progress means no chunks uploaded
        }

        res.json({ uploadedChunks: progress.uploadedChunks });
    } catch (error) {
        console.error("❌ Error fetching upload progress:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

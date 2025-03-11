const axios = require("axios");
const fs = require("fs");
const config = require('../../config/config');
// const BUNNY_STORAGE_URL = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}`;
const BUNNY_STORAGE_URL = `${config.cdn.bunny_storage_host}/${config.cdn.bunny_storage_zone}`;

const ACCESS_KEY = config.cdn.bunny_access_key;

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
        console.error("❌ BunnyCDN Chunk Upload Failed:", error.response?.data || error.message);
        throw new Error("Chunk upload failed.");
    }
};

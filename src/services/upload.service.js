const axios = require("axios");
const fs = require("fs");
const config = require('../../config');
// const BUNNY_STORAGE_URL = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}`;
const BUNNY_STORAGE_URL = `${config.cdn.bunny_storage_host}/${config.cdn.bunny_storage_zone}`;

const ACCESS_KEY = config.cdn.bunny_access_key;

const PULL_ZONE = config.cdn.bunny_pull_zone;

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


exports.uploadToBunnyCDN =async (filePath, fileName) =>{
    try {
        // ✅ Ensure the merged file actually exists before attempting upload
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileStream = fs.createReadStream(filePath);
        const uploadUrl = `${BUNNY_STORAGE_URL}/videos/${fileName}`;

        console.log("🚀 Uploading to BunnyCDN:", uploadUrl);
        await axios.put(uploadUrl, fileStream, {
            headers: {
                AccessKey: ACCESS_KEY,
                "Content-Type": "application/octet-stream",
            },
            maxBodyLength: Infinity,
        });

        return `${PULL_ZONE}/videos/${fileName}`;
    } catch (error) {
        throw new Error(`BunnyCDN Upload Failed: ${error.message}`);
    }
}


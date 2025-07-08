const axios = require('axios');
// const { STORAGE_API_KEY, STORAGE_REGION_HOST } = require('../config/bunnycdn.config');
const config = require('../../config');

const STORAGE_API_KEY = config.cdn.bunny_access_key

const BUNNYCDN_BASE_URL = `${config.cdn.bunny_storage_host}`;

/**
 * Uploads a chunk/file to BunnyCDN.
 * @param {Buffer} dataBuffer - The binary data of the chunk/file.
 * @param {string} bunnyPath - The full path on BunnyCDN (e.g., yourZone/temp_uploads/...).
 * @returns {Promise<void>}
 */
const uploadToBunnyCDN = async (dataBuffer, bunnyPath) => {
    const url = `${BUNNYCDN_BASE_URL}/${bunnyPath}`;
    try {
        await axios.put(url, dataBuffer, {
            headers: {
                'AccessKey': STORAGE_API_KEY,
                'Content-Type': 'application/octet-stream',
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        console.log(`Successfully uploaded to BunnyCDN: ${bunnyPath}`);
    } catch (error) {
        console.error(`Error uploading to BunnyCDN ${bunnyPath}:`, error.response ? error.response.data : error.message);
        throw new Error(`BunnyCDN upload failed: ${error.message}`);
    }
};

/**
 * Deletes a file or directory from BunnyCDN.
 * @param {string} bunnyPath - The full path to delete (e.g., yourZone/temp_uploads/...).
 * @returns {Promise<boolean>}
 */
const deleteFromBunnyCDN = async (bunnyPath) => {
    const url = `${BUNNYCDN_BASE_URL}/${bunnyPath}`;
    try {
        await axios.delete(url, {
            headers: {
                'AccessKey': STORAGE_API_KEY,
            }
        });
        console.log(`Successfully deleted from BunnyCDN: ${bunnyPath}`);
        return true;
    } catch (error) {
        console.error(`Error deleting from BunnyCDN ${bunnyPath}:`, error.response ? error.response.data : error.message);
        // Don't re-throw, just return false for cleanup failures
        return false;
    }
};

/**
 * Downloads a file from BunnyCDN.
 * @param {string} bunnyPath - The full path to the file on BunnyCDN.
 * @returns {Promise<Buffer>} The binary data of the file.
 */
const downloadFromBunnyCDN = async (bunnyPath) => {
    const url = `${BUNNYCDN_BASE_URL}/${bunnyPath}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'AccessKey': STORAGE_API_KEY,
            },
            responseType: 'arraybuffer' // Get raw binary data
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error(`Error downloading from BunnyCDN ${bunnyPath}:`, error.response ? error.response.data : error.message);
        throw new Error(`BunnyCDN download failed: ${error.message}`);
    }
};

module.exports = {
    uploadToBunnyCDN,
    deleteFromBunnyCDN,
    downloadFromBunnyCDN,
};
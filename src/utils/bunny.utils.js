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
        // console.log(`Successfully uploaded to BunnyCDN: ${bunnyPath}`);
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
        // console.log(`Successfully deleted from BunnyCDN: ${bunnyPath}`);
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



/**
 * Fetch video play info from BunnyCDN based on libraryId and guid
 * @param {Number} libraryId - ID of the BunnyCDN video library
 * @param {String} guid - GUID of the video
 * @param {Number} [expires=0] - Expiration timestamp or 0 for no expiration
 * @returns {Promise<Object>} - JSON response from BunnyCDN
 */


const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;


async function fetchVideoDataByGuid(guid, expires = 0) {
    const url = `https://video.bunnycdn.com/library/${BUNNY_STREAM_LIBRARY_ID}/videos/${guid}/play?expires=${expires}`;
    const options = { method: 'GET', headers: { accept: 'application/json' } };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`BunnyCDN API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (err) {
        throw new Error(`Error fetching video data for GUID ${guid}: ${err.message}`);
    }
}

module.exports = {
    uploadToBunnyCDN,
    deleteFromBunnyCDN,
    downloadFromBunnyCDN,
    fetchVideoDataByGuid
};
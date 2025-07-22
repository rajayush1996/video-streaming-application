const VideoMetadata = require('../models/videoMetaData');



/**
 * Create a new VideoMetadata document.
 * @param {Object} data - Video metadata object matching VideoMetadata schema
 * @returns {Promise<Object>} - Created VideoMetadata document
 */
async function createVideoMetadata(data) {
    try {
        const metadata = new VideoMetadata(data);
        return await metadata.save();
    } catch (err) {
        throw new Error(`Error creating VideoMetadata: ${err.message}`);
    }
}

/**
 * Fetch VideoMetadata documents.
 * @param {Object} filter - Mongoose filter object (e.g., { guid } or { libraryId })
 * @returns {Promise<Array>} - Array of matching VideoMetadata documents
 */
async function getVideoMetadata(filter = {}, query) {
    try {
        filter.processingStatus = 'done';
        if(!query.sortBy) {
            query.shuffle = true
        }
        return await VideoMetadata.paginate(filter, query);
    } catch (err) {
        throw new Error(`Error fetching VideoMetadata: ${err.message}`);
    }
}

async function getVideoMetaDataById(id) {
    try {
        return await VideoMetadata.findOne({ _id: id });
    } catch (err) {
        throw new Error(`Error fetching VideoMetadata: ${err.message}`);
    }
}


/**
 * Updates an existing video metadata record by _id.
 * @param {string} id   the document’s _id
 * @param {Object} update  the fields to set (can include processingStatus, errorMessage, and all other meta fields)
 * @returns {Promise<Object|null>} the updated document (or null if not found)
 */
async function updateVideoMetadata(id, update) {
    return VideoMetadata.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true }
    ).exec();
}

module.exports = {
    createVideoMetadata,
    getVideoMetadata,
    getVideoMetaDataById,
    updateVideoMetadata
};

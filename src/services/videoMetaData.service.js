const VideoMetadata = require('../models/videoMetaData');
const videoViewService = require('./videoView.service');



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
        filter.approvedStatus = 'approved';
        filter.isDeleted = false;
        if(!query.sortBy) {
            query.shuffle = true
        }
        
        const result = await VideoMetadata.paginate(filter, query);
        if (result.results && result.results.length) {
            const viewMap = await videoViewService.getViewCounts(result.results.map(r => r._id));
            result.results = result.results.map(r => {
                const obj = r.toObject ? r.toObject() : r;
                obj.views = viewMap[obj._id.toString()] || 0;
                return obj;
            });
        }
        return result;
    } catch (err) {
        throw new Error(`Error fetching VideoMetadata: ${err.message}`);
    }
}

async function getVideoMetaDataById(id) {
    try {
        // let objectId;
        // if(typeof id === 'String') {
        //     objectId = 
        // }
        const doc = await VideoMetadata.findOne({ _id: id });
        if (!doc) return null;
        const obj = doc.toObject ? doc.toObject() : doc;
        obj.views = await videoViewService.getViewCount(id);
        return obj;
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

/**
 * Updates an existing video metadata record by guid.
 * @param {string} guid the video guid
 * @param {Object} update fields to update
 * @returns {Promise<Object|null>} the updated document
 */
async function updateVideoMetadataByGuid(guid, update) {
    return VideoMetadata.findOneAndUpdate(
        { guid },
        { $set: update },
        { new: true, runValidators: true }
    ).exec();
}

module.exports = {
    createVideoMetadata,
    getVideoMetadata,
    getVideoMetaDataById,
    updateVideoMetadata,
    updateVideoMetadataByGuid
};

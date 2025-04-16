const Joi = require('joi');

/**
 * Validation schema for media metadata query parameters
 */
const getMediaMetadataSchema = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).description('Page number'),
        limit: Joi.number().integer().min(1).max(100).description('Number of results per page'),
        sortBy: Joi.string().pattern(/^[a-zA-Z0-9_]+:(asc|desc)$/).description('Sort field and direction (e.g., createdAt:desc)'),
        thumbnailId: Joi.string().description('Filter by thumbnail ID'),
        mediaFileId: Joi.string().description('Filter by media file ID')
    })
};

module.exports = {
    getMediaMetadataSchema
}; 
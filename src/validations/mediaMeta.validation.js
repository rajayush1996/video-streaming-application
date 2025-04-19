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

/**
 * Validation schema for updating media metadata
 */
const updateMediaMetadataSchema = {
    params: Joi.object().keys({
        id: Joi.string().required().description('Media metadata ID')
    }),
    body: Joi.object().keys({
        title: Joi.string().optional(),
        description: Joi.string().optional(),
        category: Joi.string().optional()
    })
};

/**
 * Validation schema for deleting media metadata
 */
const deleteMediaMetadataSchema = {
    params: Joi.object().keys({
        id: Joi.string().required().description('Media metadata ID')
    })
};

/**
 * Validation schema for restoring media metadata
 */
const restoreMediaMetadataSchema = {
    params: Joi.object().keys({
        id: Joi.string().required().description('Media metadata ID')
    })
};

module.exports = {
    getMediaMetadataSchema,
    updateMediaMetadataSchema,
    deleteMediaMetadataSchema,
    restoreMediaMetadataSchema
}; 
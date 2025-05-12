const Joi = require('joi');

/**
 * Validation schema for media metadata query parameters
 */
const getMediaMetadataSchema = {
    query: Joi.object({
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
    params: Joi.object({
        id: Joi.string().required().description('Media metadata ID')
    }),
    body: Joi.object({
        title: Joi.string().optional(),
        description: Joi.string().optional(),
        category: Joi.string().optional()
    })
};

/**
 * Validation schema for deleting media metadata
 */
const deleteMediaMetadataSchema = {
    params: Joi.object({
        id: Joi.string().required().description('Media metadata ID')
    })
};

/**
 * Validation schema for restoring media metadata
 */
const restoreMediaMetadataSchema = {
    params: Joi.object({
        id: Joi.string().required().description('Media metadata ID')
    })
};

const approveMediaSchema = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};

const rejectMediaSchema = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object().keys({
        rejectionReason: Joi.string().max(500).required(),
    }),
};

const getPendingMediaSchema = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1),
        sortBy: Joi.string(),
        mediaType: Joi.string().valid('video', 'reel', 'thumbnail'),
    }),
};

const getApprovedMediaSchema = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1),
        sortBy: Joi.string(),
        mediaType: Joi.string().valid('video', 'reel', 'thumbnail'),
    }),
};

const getRejectedMediaSchema = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1),
        sortBy: Joi.string(),
        mediaType: Joi.string().valid('video', 'reel', 'thumbnail'),
    }),
};

module.exports = {
    getMediaMetadataSchema,
    updateMediaMetadataSchema,
    deleteMediaMetadataSchema,
    restoreMediaMetadataSchema,
    approveMediaSchema,
    rejectMediaSchema,
    getPendingMediaSchema,
    getApprovedMediaSchema,
    getRejectedMediaSchema,
}; 
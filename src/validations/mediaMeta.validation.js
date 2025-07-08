const Joi = require('joi');

/**
 * Validation schema for media metadata query parameters
 */
const getMediaMetadataSchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).description('Page number'),
        limit: Joi.number().integer().min(1).max(100).description('Number of results per page'),
        sortBy: Joi.string().pattern(/^[a-zA-Z0-9_]+:(asc|desc)$/).description('Sort field and direction (e.g., createdAt:desc)'),
        thumbnailId: Joi.string().description('Filter by thumbnail ID').optional(),
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

/**
 * Validation schema for creating media metadata
 */
const createMediaMetadataSchema = {
    body: Joi.object({
        thumbnailId: Joi.string().optional().description('Thumbnail file ID'),
        mediaFileId: Joi.string().required().description('Media file ID'),
        title: Joi.string().min(3).max(100).required().description('Media title'),
        description: Joi.string().optional().max(1000).optional().description('Media description'),
        category: Joi.string().max(50).allow('').optional().description('Media category'),
        mediaType: Joi.string().valid('video', 'reel', 'thumbnail').default('video').description('Type of media'),
        userId: Joi.string().optional().description('User ID of the uploader'),
        status: Joi.string().valid('pending', 'approved', 'rejected').optional().description('Media status'),
        rejectionReason: Joi.string().max(500).allow('').optional().description('Reason for rejection if rejected'),
        reviewedBy: Joi.string().allow('').optional().description('ID of the reviewer'),
        reviewedAt: Joi.date().allow(null).optional().description('Date of review'),
        isDeleted: Joi.boolean().default(false).description('Soft delete flag'),
        deletedAt: Joi.date().allow(null).optional().description('Date of deletion')
    })
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
    createMediaMetadataSchema,
}; 
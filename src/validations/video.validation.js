const Joi = require('joi');

const getVideosSchema = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        category: Joi.string().optional(),
        sortBy: Joi.string().valid('createdAt', 'viewCount', 'likeCount').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
        featured: Joi.boolean().optional()
    })
};

const getVideoByIdSchema = {
    params: Joi.object().keys({
        videoId: Joi.string().required()
    })
};

module.exports = {
    getVideosSchema,
    getVideoByIdSchema
}; 
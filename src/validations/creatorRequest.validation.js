const Joi = require('joi');

const createCreatorRequestSchema = {
    body: Joi.object().keys({
        reason: Joi.string().max(500).required(),
        portfolio: Joi.string().max(1000),
        socialLinks: Joi.object({
            youtube: Joi.string().uri(),
            instagram: Joi.string().uri(),
            twitter: Joi.string().uri(),
            website: Joi.string().uri()
        })
    })
};

const getCreatorRequestsSchema = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1),
        status: Joi.string().valid('pending', 'approved', 'rejected'),
        sortBy: Joi.string()
    })
};

const updateCreatorRequestSchema = {
    params: Joi.object().keys({
        id: Joi.string().required()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('approved', 'rejected').required(),
        rejectionReason: Joi.string().max(500).when('status', {
            is: 'rejected',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        })
    })
};

const getCreatorRequestByIdSchema = {
    params: Joi.object().keys({
        id: Joi.string().required()
    })
};

module.exports = {
    createCreatorRequestSchema,
    getCreatorRequestsSchema,
    updateCreatorRequestSchema,
    getCreatorRequestByIdSchema
}; 
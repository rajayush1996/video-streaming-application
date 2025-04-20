const Joi = require('joi');

const getReelsSchema = {
    query: Joi.object().keys({
        title: Joi.string(),
        category: Joi.string(),
        userId: Joi.string(),
        status: Joi.string().valid('pending', 'approved', 'rejected'),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getReelSchema = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};

const updateReelSchema = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
    body: Joi.object()
        .keys({
            title: Joi.string(),
            description: Joi.string(),
            category: Joi.string(),
            status: Joi.string().valid('pending', 'approved', 'rejected'),
        })
        .min(1),
};

const deleteReelSchema = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};

const viewReelSchema = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};

module.exports = {
    getReelsSchema,
    getReelSchema,
    updateReelSchema,
    deleteReelSchema,
    viewReelSchema,
}; 
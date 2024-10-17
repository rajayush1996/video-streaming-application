const Joi = require('joi');

// Joi Schema for Feed Validation
const createFeedValidationSchema = {
    body: Joi.object({
        type: Joi.string().valid('POST', 'SHOW', 'COLLAB', 'AUDIO').required(),
        authorId: Joi.string().required(),
        content: Joi.string().when('type', { is: 'SHOW', then: Joi.forbidden(), otherwise: Joi.required() }),
        visibility: Joi.string().valid('PUBLIC', 'PRIVATE').default('PUBLIC'),
        tags: Joi.string().optional(),
        files: Joi.array().items(
            Joi.object({
                originalname: Joi.string().required(),
                mimetype: Joi.string().valid('image/jpeg', 'image/png', 'video/mp4').required(),
                buffer: Joi.binary().required(),
            })
        ).optional(),
        // Fields specific to type 'SHOW'
        title: Joi.string().when('type', { is: 'SHOW', then: Joi.required() }),
        description: Joi.string().when('type', { is: 'SHOW', then: Joi.required() }),
        date: Joi.number().when('type', { is: 'SHOW', then: Joi.required() }),
        phone: Joi.string().when('type', { is: 'SHOW', then: Joi.required() }),
        email: Joi.string().email().when('type', { is: 'SHOW', then: Joi.required() }),
        passType: Joi.string().when('type', { is: 'SHOW', then: Joi.required() })
    })
};

module.exports = {
    createFeedValidationSchema
};
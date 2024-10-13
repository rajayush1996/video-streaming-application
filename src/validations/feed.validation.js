const Joi = require('joi');

// Joi Schema for Feed Validation
const createFeedValidationSchema = {
    body: Joi.object({
        type: Joi.string().valid('POST', 'SHOW', 'COLLAB', 'AUDIO').required(),
        authorId: Joi.string().required(),
        content: Joi.string().required(),
        visibility: Joi.string().valid('PUBLIC', 'PRIVATE').default('PUBLIC'),
        tags: Joi.string().optional(),
        files: Joi.array().items(
            Joi.object({
                originalname: Joi.string().required(),
                mimetype: Joi.string().valid('image/jpeg', 'image/png', 'video/mp4').required(),
                buffer: Joi.binary().required(),
            })
        ).optional(),
    })
};

module.exports = {
    createFeedValidationSchema
}

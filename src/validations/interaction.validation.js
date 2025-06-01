const Joi = require('joi');

const recordInteraction = {
    body: Joi.object().keys({
        type: Joi.string()
            .valid('follow', 'unfollow', 'like', 'unlike', 'comment', 'reply', 'share', 'bookmark', 'mention', 'tag')
            .required(),
        targetType: Joi.string()
            .valid('user', 'media', 'blog', 'comment')
            .required(),
        targetId: Joi.string().required(),
        metadata: Joi.object().keys({
            text: Joi.string().when('type', {
                is: Joi.string().valid('comment', 'reply'),
                then: Joi.required(),
                otherwise: Joi.forbidden()
            }),
            parentId: Joi.string().when('type', {
                is: 'reply',
                then: Joi.required(),
                otherwise: Joi.forbidden()
            })
        })
    })
};

const getInteractionsByTarget = {
    params: Joi.object().keys({
        targetType: Joi.string()
            .valid('user', 'media', 'blog', 'comment')
            .required(),
        targetId: Joi.string().required()
    }),
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
    })
};

const markAsRead = {
    body: Joi.object().keys({
        interactionIds: Joi.array().items(Joi.string()).min(1).required()
    })
};

const archiveInteractions = {
    body: Joi.object().keys({
        interactionIds: Joi.array().items(Joi.string()).min(1).required()
    })
};

module.exports = {
    recordInteraction,
    getInteractionsByTarget,
    markAsRead,
    archiveInteractions
}; 
const Joi = require('joi');

const getHomeFeed = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        category: Joi.string().optional(),
        featured: Joi.boolean().optional()
    })
};

module.exports = {
    getHomeFeed
}; 
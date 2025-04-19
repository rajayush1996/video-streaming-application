const Joi = require('joi');

const createCategorySchema = {
    body: Joi.object().keys({
        name: Joi.string().required().trim().min(1).max(100),
        description: Joi.string().trim().max(500).allow(''),
        slug: Joi.string().required().trim().min(1).max(100),
        isActive: Joi.boolean().default(true),
        parentCategory: Joi.string().hex().length(24).allow(null)
    })
};

const updateCategorySchema = {
    body: Joi.object().keys({
        name: Joi.string().trim().min(1).max(100),
        description: Joi.string().trim().max(500).allow(''),
        slug: Joi.string().trim().min(1).max(100),
        isActive: Joi.boolean(),
        parentCategory: Joi.string().hex().length(24).allow(null)
    }).min(1)
};

const getCategoriesSchema = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().default('-createdAt'),
        isActive: Joi.boolean(),
        parentCategory: Joi.string().hex().length(24)
    })
};

module.exports = {
    createCategorySchema,
    updateCategorySchema,
    getCategoriesSchema
}; 
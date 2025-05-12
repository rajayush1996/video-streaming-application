const Joi = require('joi');

const createBlogSchema = {
    body: Joi.object({
        title: Joi.string().required().min(3).max(200).messages({
            'string.empty': 'Title cannot be empty',
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 200 characters',
            'any.required': 'Title is required'
        }),
        content: Joi.string().required().min(50).max(50000).messages({
            'string.empty': 'Content cannot be empty',
            'string.min': 'Content must be at least 50 characters long',
            'string.max': 'Content cannot exceed 50000 characters',
            'any.required': 'Content is required'
        }),
        tags: Joi.array().items(Joi.string()).max(10).messages({
            'array.max': 'Cannot add more than 10 tags'
        }),
        category: Joi.string().required().messages({
            'string.empty': 'Category cannot be empty',
            'any.required': 'Category is required'
        }),
        isPublished: Joi.boolean().default(false),
        thumbnailUrl: Joi.string().uri().messages({
            'string.uri': 'Thumbnail URL must be a valid URI'
        })
    })
};

const updateBlogSchema = {
    params: Joi.object({
        id: Joi.string().required().messages({
            'string.empty': 'Blog ID cannot be empty',
            'any.required': 'Blog ID is required'
        })
    }),
    body: Joi.object({
        title: Joi.string().min(3).max(200).messages({
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title cannot exceed 200 characters'
        }),
        content: Joi.string().min(50).max(50000).messages({
            'string.min': 'Content must be at least 50 characters long',
            'string.max': 'Content cannot exceed 50000 characters'
        }),
        tags: Joi.array().items(Joi.string()).max(10).messages({
            'array.max': 'Cannot add more than 10 tags'
        }),
        category: Joi.string(),
        isPublished: Joi.boolean(),
        thumbnailUrl: Joi.string().uri().messages({
            'string.uri': 'Thumbnail URL must be a valid URI'
        })
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};

const getBlogSchema = {
    params: Joi.object({
        id: Joi.string().required().messages({
            'string.empty': 'Blog ID cannot be empty',
            'any.required': 'Blog ID is required'
        })
    })
};

const getBlogsSchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().pattern(/^(createdAt|updatedAt|title|views):(asc|desc)$/).default('createdAt:desc').messages({
            'string.pattern.base': '"sortBy" must be in format "field:direction" where field is one of [createdAt, updatedAt, title, views] and direction is [asc, desc]'
        }),
        category: Joi.string(),
        tag: Joi.string(),
        search: Joi.string().min(3).max(50),
        status: Joi.string().valid('draft', 'published', 'all').default('all')
    })
};

const deleteBlogSchema = {
    params: Joi.object({
        id: Joi.string().required().messages({
            'string.empty': 'Blog ID cannot be empty',
            'any.required': 'Blog ID is required'
        })
    })
};

const publishBlogSchema = {
    params: Joi.object({
        id: Joi.string().required().messages({
            'string.empty': 'Blog ID cannot be empty',
            'any.required': 'Blog ID is required'
        })
    })
};

const unpublishBlogSchema = {
    params: Joi.object({
        id: Joi.string().required().messages({
            'string.empty': 'Blog ID cannot be empty',
            'any.required': 'Blog ID is required'
        })
    })
};

module.exports = {
    createBlogSchema,
    updateBlogSchema,
    getBlogSchema,
    getBlogsSchema,
    deleteBlogSchema,
    publishBlogSchema,
    unpublishBlogSchema
}; 
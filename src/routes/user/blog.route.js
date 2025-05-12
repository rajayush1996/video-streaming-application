const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const isCreator = require('../../middlewares/creator.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

// Public routes (no auth required)
router.get(
    '/',
    validate(blogValidation.getBlogsSchema),
    blogController.getAllBlogs
);

router.get(
    '/:id',
    validate(blogValidation.getBlogSchema),
    blogController.getBlogById
);

// Creator routes (require auth and creator status)
router.use(auth('createBlog'));
router.use(isCreator);

// Create new blog
router.post(
    '/',
    validate(blogValidation.createBlogSchema),
    blogController.createBlog
);

// Update blog
router.patch(
    '/:id',
    validate(blogValidation.updateBlogSchema),
    blogController.updateBlog
);

// Delete blog (soft delete)
router.delete(
    '/:id',
    validate(blogValidation.deleteBlogSchema),
    blogController.deleteBlog
);

module.exports = router; 
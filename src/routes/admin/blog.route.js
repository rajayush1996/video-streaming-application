const express = require("express");
const router = express.Router();
const blogController = require("../../controllers/blog.controller");
const auth = require("../../middlewares/auth.middleware");
const { validate } = require('../../middlewares/validation.middleware');
const blogValidation = require('../../validations/blog.validation');

// Apply admin authentication to all routes
router.use(auth('admin'));

// Blog management routes
router
    .route('/')
    .post(validate(blogValidation.createBlogSchema), blogController.createBlog)
    .get(validate(blogValidation.getBlogsSchema), blogController.getAllBlogs);

router
    .route('/:id')
    .get(validate(blogValidation.getBlogSchema), blogController.getBlogById)
    .patch(validate(blogValidation.updateBlogSchema), blogController.updateBlog)
    .delete(validate(blogValidation.deleteBlogSchema), blogController.deleteBlog);

router
    .route('/:id/publish')
    .post(validate(blogValidation.publishBlogSchema), blogController.publishBlog);

router
    .route('/:id/restore')
    .post(validate(blogValidation.getBlogSchema), blogController.restoreBlog);

module.exports = router;

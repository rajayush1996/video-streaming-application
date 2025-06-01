const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const isCreator = require('../../middlewares/creator.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

/**
 * @swagger
 * /api/v1/blogs:
 *   get:
 *     tags: [Blogs]
 *     summary: Get all blogs
 *     description: Retrieve a list of all blogs with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of blogs retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get(
    '/',
    validate(blogValidation.getBlogsSchema),
    blogController.getAllBlogs
);

/**
 * @swagger
 * /api/v1/blogs/{id}:
 *   get:
 *     tags: [Blogs]
 *     summary: Get blog by ID
 *     description: Retrieve a specific blog by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
 *       404:
 *         description: Blog not found
 */
router.get(
    '/:id',
    validate(blogValidation.getBlogSchema),
    blogController.getBlogById
);

// Creator routes (require auth and creator status)
router.use(auth('createBlog'));
router.use(isCreator);

/**
 * @swagger
 * /api/v1/blogs:
 *   post:
 *     tags: [Blogs]
 *     summary: Create a new blog
 *     description: Create a new blog post (requires creator status)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    validate(blogValidation.createBlogSchema),
    blogController.createBlog
);

/**
 * @swagger
 * /api/v1/blogs/{id}:
 *   patch:
 *     tags: [Blogs]
 *     summary: Update a blog
 *     description: Update an existing blog post (requires creator status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog not found
 */
router.patch(
    '/:id',
    validate(blogValidation.updateBlogSchema),
    blogController.updateBlog
);

/**
 * @swagger
 * /api/v1/blogs/{id}:
 *   delete:
 *     tags: [Blogs]
 *     summary: Delete a blog
 *     description: Soft delete a blog post (requires creator status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog not found
 */
router.delete(
    '/:id',
    validate(blogValidation.deleteBlogSchema),
    blogController.deleteBlog
);

module.exports = router; 
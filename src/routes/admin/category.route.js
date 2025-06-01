const express = require('express');
const CategoryController = require('../../controllers/category.controller');
const auth = require('../../middlewares/auth.middleware');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth('admin'));

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     description: Create a new category (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [blog, media, reels]
 *               parentId:
 *                 type: string
 *                 description: ID of parent category (optional)
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     description: Retrieve a list of all categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [blog, media, reels]
 *         description: Filter by category type
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', CategoryController.createCategory);
router.get('/', CategoryController.getAllCategories);

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     description: Retrieve a specific category by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 *   put:
 *     tags: [Categories]
 *     summary: Update category
 *     description: Update a specific category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [blog, media, reels]
 *               parentId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category
 *     description: Delete a specific category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 */
router.get('/:id', CategoryController.getCategoryById);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

/**
 * @swagger
 * /api/v1/categories/parent/{parentId}:
 *   get:
 *     tags: [Categories]
 *     summary: Get categories by parent
 *     description: Retrieve all categories that belong to a specific parent category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent category ID
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Parent category not found
 */
router.get('/parent/:parentId', CategoryController.getCategoriesByParent);

/**
 * @swagger
 * /api/v1/categories/{id}/toggle-status:
 *   patch:
 *     tags: [Categories]
 *     summary: Toggle category status
 *     description: Toggle the active status of a category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category status toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Category not found
 */
router.patch('/:id/toggle-status', CategoryController.toggleCategoryStatus);

/**
 * @swagger
 * /api/v1/categories/type/{type}:
 *   get:
 *     tags: [Categories]
 *     summary: Get categories by type
 *     description: Retrieve all categories of a specific type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [blog, media, reels]
 *         description: Category type
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/type/:type', CategoryController.getCategoriesByType);

/**
 * @swagger
 * /api/v1/categories/type/{type}/tree:
 *   get:
 *     tags: [Categories]
 *     summary: Get category tree by type
 *     description: Retrieve a hierarchical tree of categories for a specific type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [blog, media, reels]
 *         description: Category type
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/type/:type/tree', CategoryController.getCategoryTreeByType);

module.exports = router;
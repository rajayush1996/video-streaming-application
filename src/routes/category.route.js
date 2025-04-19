const express = require('express');
const { validate } = require('../middlewares/validation.middleware');
const { createCategorySchema, updateCategorySchema, getCategoriesSchema } = require('../validations/category.validation');
const { 
    createCategory, 
    getCategories, 
    getCategory, 
    updateCategory, 
    deleteCategory,
    getCategoriesByParent,
    toggleCategoryStatus
} = require('../controllers/category.controller');
const authenticated = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               isActive:
 *                 type: boolean
 *               parentCategory:
 *                 type: string
 *                 format: objectId
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticated, validate(createCategorySchema), createCategory);

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: parentCategory
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', validate(getCategoriesSchema), getCategories);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:categoryId', getCategory);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   patch:
 *     summary: Update category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               isActive:
 *                 type: boolean
 *               parentCategory:
 *                 type: string
 *                 format: objectId
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.patch('/:categoryId', authenticated, validate(updateCategorySchema), updateCategory);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.delete('/:categoryId', authenticated, deleteCategory);

/**
 * @swagger
 * /api/v1/categories/parent/{parentId}:
 *   get:
 *     summary: Get categories by parent ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of child categories
 *       404:
 *         description: Parent category not found
 */
router.get('/parent/:parentId', getCategoriesByParent);

/**
 * @swagger
 * /api/v1/categories/{categoryId}/toggle-status:
 *   patch:
 *     summary: Toggle category active status
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.patch('/:categoryId/toggle-status', authenticated, toggleCategoryStatus);

module.exports = router; 
const express = require('express');
const CategoryController = require('../../controllers/category.controller');
const auth = require('../../middlewares/auth.middleware');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth('admin'));

// POST /api/v1/categories
router.post('/', CategoryController.createCategory);

// GET /api/v1/categories
router.get('/', CategoryController.getAllCategories);

// GET /api/v1/categories/:id
router.get('/:id', CategoryController.getCategoryById);

// PUT /api/v1/categories/:id
router.put('/:id', CategoryController.updateCategory);

// DELETE /api/v1/categories/:id
router.delete('/:id', CategoryController.deleteCategory);

// GET /api/v1/categories/parent/:parentId
router.get('/parent/:parentId', CategoryController.getCategoriesByParent);

// PATCH /api/v1/categories/:id/toggle-status
router.patch('/:id/toggle-status', CategoryController.toggleCategoryStatus);

// GET /api/v1/categories/type/:type
router.get('/type/:type', CategoryController.getCategoriesByType);

// GET /api/v1/categories/type/:type/tree
router.get('/type/:type/tree', CategoryController.getCategoryTreeByType);

module.exports = router;
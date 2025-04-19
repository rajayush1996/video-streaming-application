const httpStatus = require('http-status');
const categoryService = require('../services/category.service');
const logger = require('../features/logger');

/**
 * Create a new category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const createCategory = async (req, res, next) => {
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        logger.error('Error in createCategory:', error);
        next(error);
    }
};

/**
 * Get all categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const getCategories = async (req, res, next) => {
    try {
        const result = await categoryService.getAllCategories(req.query);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Categories retrieved successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error in getCategories:', error);
        next(error);
    }
};

/**
 * Get category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const getCategory = async (req, res, next) => {
    try {
        const category = await categoryService.getCategoryById(req.params.categoryId);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Category retrieved successfully',
            data: category
        });
    } catch (error) {
        logger.error('Error in getCategory:', error);
        next(error);
    }
};

/**
 * Update category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const updateCategory = async (req, res, next) => {
    try {
        const category = await categoryService.updateCategory(req.params.categoryId, req.body);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        logger.error('Error in updateCategory:', error);
        next(error);
    }
};

/**
 * Delete category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req.params.categoryId);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        logger.error('Error in deleteCategory:', error);
        next(error);
    }
};

/**
 * Get categories by parent ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const getCategoriesByParent = async (req, res, next) => {
    try {
        const result = await categoryService.getCategoriesByParent(req.params.parentId, req.query);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Child categories retrieved successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error in getCategoriesByParent:', error);
        next(error);
    }
};

/**
 * Toggle category status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const toggleCategoryStatus = async (req, res, next) => {
    try {
        const category = await categoryService.toggleCategoryStatus(req.params.categoryId);
        res.status(httpStatus.OK).json({
            success: true,
            message: 'Category status toggled successfully',
            data: category
        });
    } catch (error) {
        logger.error('Error in toggleCategoryStatus:', error);
        next(error);
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByParent,
    toggleCategoryStatus
}; 
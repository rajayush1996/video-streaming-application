const httpStatus = require('http-status');
const CategoryService = require('../services/category.service');
const logger = require('../features/logger');

class CategoryController {
    async createCategory(req, res, next) {
        try {
            const category = await CategoryService.createCategory(req.body);
            return res.status(httpStatus.CREATED).json({ success: true, data: category });
        } catch (error) {
            logger.error('Create category failed:', error);
            next(error);
        }
    }

    async getAllCategories(req, res, next) {
        try {
            const categories = await CategoryService.getAllCategories(req.query);
            return res.status(httpStatus.OK).json({ success: true, data: categories });
        } catch (error) {
            logger.error('Get all categories failed:', error);
            next(error);
        }
    }

    async getAllCategoriesList(req, res, next) {
        try {
            console.log("🚀 ~ :29 ~ CategoryController ~ getAllCategoriesList ~ req.query:", req.query)
            const categories = await CategoryService.getAllCategoriesList(req.query);
            return res.status(httpStatus.OK).json({ success: true, data: categories });
        } catch (error) {
            logger.error('Get all categories failed:', error);
            next(error);
        }
    }

    async getCategoryById(req, res, next) {
        try {
            const category = await CategoryService.getCategoryById(req.params.id);
            return res.status(httpStatus.OK).json({ success: true, data: category });
        } catch (error) {
            logger.error('Get category by ID failed:', error);
            next(error);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const updated = await CategoryService.updateCategory(req.params.id, req.body);
            return res.status(httpStatus.OK).json({ success: true, data: updated });
        } catch (error) {
            logger.error('Update category failed:', error);
            next(error);
        }
    }

    async deleteCategory(req, res, next) {
        try {
            await CategoryService.deleteCategory(req.params.id);
            return res.status(httpStatus.NO_CONTENT).send();
        } catch (error) {
            logger.error('Delete category failed:', error);
            next(error);
        }
    }

    async getCategoriesByParent(req, res, next) {
        try {
            const categories = await CategoryService.getCategoriesByParent(req.params.parentId, req.query);
            return res.status(httpStatus.OK).json({ success: true, data: categories });
        } catch (error) {
            logger.error('Get categories by parent failed:', error);
            next(error);
        }
    }

    async toggleCategoryStatus(req, res, next) {
        try {
            const category = await CategoryService.toggleCategoryStatus(req.params.id);
            return res.status(httpStatus.OK).json({ success: true, data: category });
        } catch (error) {
            logger.error('Toggle category status failed:', error);
            next(error);
        }
    }

    async getCategoriesByType(req, res, next) {
        try {
            const categories = await CategoryService.getCategoriesByType(req.params.type);
            return res.status(httpStatus.OK).json({ success: true, data: categories });
        } catch (error) {
            logger.error('Get categories by type failed:', error);
            next(error);
        }
    }

    async getCategoryTreeByType(req, res, next) {
        try {
            const tree = await CategoryService.getCategoryTreeByType(req.params.type);
            return res.status(httpStatus.OK).json({ success: true, data: tree });
        } catch (error) {
            logger.error('Get category tree failed:', error);
            next(error);
        }
    }
}

module.exports = new CategoryController();

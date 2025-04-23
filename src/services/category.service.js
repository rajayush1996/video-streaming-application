const Category = require('../models/category.model');
const httpStatus = require('http-status');
const { ApiError } = require('../features/error');
const logger = require('../features/logger');

class CategoryService {
    async createCategory(categoryData) {
        try {
            if (categoryData.parentId) {
                const parent = await Category.findById(categoryData.parentId);
                if (!parent) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Parent category not found');
                }
            }
            const category = await Category.create(categoryData);
            return category;
        } catch (error) {
            logger.error('Error creating category:', error);
            if (error.code === 11000) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Duplicate category name or slug');
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating category');
        }
    }

    async getAllCategories({ page = 1, limit = 10, sortBy = '-createdAt', isActive, parentId }) {
        try {
            const filter = {};
            if (isActive !== undefined) filter.isActive = isActive;
            if (parentId) filter.parentId = parentId;

            const result = await Category.paginate(filter, {
                page,
                limit,
                sort: sortBy,
                populate: 'parentId',
            });
            return result;
        } catch (error) {
            logger.error('Error fetching all categories:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching categories');
        }
    }

    async getCategoryById(id) {
        try {
            const category = await Category.findById(id).populate('parentId');
            if (!category) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
            return category;
        } catch (error) {
            logger.error('Error fetching category by ID:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching category');
        }
    }

    async updateCategory(id, updateData) {
        try {
            if (updateData.parentId) {
                const parent = await Category.findById(updateData.parentId);
                if (!parent) throw new ApiError(httpStatus.BAD_REQUEST, 'Parent category not found');
            }

            const updated = await Category.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            ).populate('parentId');

            if (!updated) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
            return updated;
        } catch (error) {
            logger.error('Error updating category:', error);
            if (error instanceof ApiError) throw error;
            if (error.code === 11000) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Duplicate category name or slug');
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating category');
        }
    }

    async deleteCategory(id) {
        try {
            const hasChildren = await Category.exists({ parentId: id });
            if (hasChildren) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete category with children');
            }
            const deleted = await Category.findByIdAndDelete(id);
            if (!deleted) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
        } catch (error) {
            logger.error('Error deleting category:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error deleting category');
        }
    }

    async getCategoriesByParent(parentId, { page = 1, limit = 10, sortBy = '-createdAt' }) {
        try {
            const result = await Category.paginate({ parentId }, {
                page,
                limit,
                sort: sortBy,
                populate: 'parentId',
            });
            return result;
        } catch (error) {
            logger.error('Error fetching child categories:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching child categories');
        }
    }

    async toggleCategoryStatus(id) {
        try {
            const category = await Category.findById(id);
            if (!category) throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');

            category.isActive = !category.isActive;
            await category.save();
            return category;
        } catch (error) {
            logger.error('Error toggling category status:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error toggling category status');
        }
    }

    async getCategoriesByType(type) {
        try {
            const categories = await Category.find({ type }).populate('parentId');
            return categories;
        } catch (error) {
            logger.error('Error fetching categories by type:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching categories by type');
        }
    }

    buildCategoryTree(categories, parentId = null) {
        return categories
            .filter(cat => String(cat.parentId?._id || cat.parentId) === String(parentId))
            .map(cat => ({
                _id: cat._id,
                name: cat.name,
                type: cat.type,
                isActive: cat.isActive,
                children: this.buildCategoryTree(categories, cat._id)
            }));
    }

    async getCategoryTreeByType(type) {
        try {
            const categories = await Category.find({ type }).populate('parentId');
            return this.buildCategoryTree(categories);
        } catch (error) {
            logger.error('Error building category tree:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error building category tree');
        }
    }
}

module.exports = new CategoryService();

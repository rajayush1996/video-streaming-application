const Category = require('../models/category.model');
const httpStatus = require('http-status');
const { ApiError } = require('../features/error');
const logger = require('../features/logger');

class CategoryService {
    /**
     * Create a new category
     * @param {Object} categoryData - Category data
     * @returns {Promise<Category>}
     */
    async createCategory(categoryData) {
        try {
            // Check if parent category exists if provided
            if (categoryData.parentCategory) {
                const parentCategory = await Category.findById(categoryData.parentCategory);
                if (!parentCategory) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Parent category not found');
                }
            }

            const category = new Category(categoryData);
            await category.save();
            return category;
        } catch (error) {
            logger.error('Error creating category:', error);
            if (error.code === 11000) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Category name or slug already exists');
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating category');
        }
    }

    /**
     * Get all categories with pagination and filtering
     * @param {Object} options - Pagination and filter options
     * @returns {Promise<Object>}
     */
    async getAllCategories(options) {
        try {
            const { page = 1, limit = 10, sortBy = '-createdAt', isActive, parentCategory } = options;
            const filter = {};
            
            if (isActive !== undefined) {
                filter.isActive = isActive;
            }

            if (parentCategory) {
                filter.parentCategory = parentCategory;
            }

            const result = await Category.paginate(filter, {
                page,
                limit,
                sort: sortBy,
                populate: 'parentCategory'
            });

            return result;
        } catch (error) {
            logger.error('Error fetching categories:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching categories');
        }
    }

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {Promise<Category>}
     */
    async getCategoryById(categoryId) {
        try {
            const category = await Category.findById(categoryId).populate('parentCategory');
            if (!category) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
            }
            return category;
        } catch (error) {
            logger.error('Error fetching category:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching category');
        }
    }

    /**
     * Update category by ID
     * @param {string} categoryId - Category ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Category>}
     */
    async updateCategory(categoryId, updateData) {
        try {
            // Check if parent category exists if provided
            if (updateData.parentCategory) {
                const parentCategory = await Category.findById(updateData.parentCategory);
                if (!parentCategory) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Parent category not found');
                }
            }

            const category = await Category.findByIdAndUpdate(
                categoryId,
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            ).populate('parentCategory');

            if (!category) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
            }

            return category;
        } catch (error) {
            logger.error('Error updating category:', error);
            if (error instanceof ApiError) throw error;
            if (error.code === 11000) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Category name or slug already exists');
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating category');
        }
    }

    /**
     * Delete category by ID
     * @param {string} categoryId - Category ID
     * @returns {Promise<void>}
     */
    async deleteCategory(categoryId) {
        try {
            // Check if category has any child categories
            const hasChildren = await Category.exists({ parentCategory: categoryId });
            if (hasChildren) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete category with child categories');
            }

            const category = await Category.findByIdAndDelete(categoryId);
            if (!category) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
            }
        } catch (error) {
            logger.error('Error deleting category:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error deleting category');
        }
    }

    /**
     * Get categories by parent ID
     * @param {string} parentId - Parent category ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>}
     */
    async getCategoriesByParent(parentId, options) {
        try {
            const { page = 1, limit = 10, sortBy = '-createdAt' } = options;
            const result = await Category.paginate(
                { parentCategory: parentId },
                {
                    page,
                    limit,
                    sort: sortBy,
                    populate: 'parentCategory'
                }
            );
            return result;
        } catch (error) {
            logger.error('Error fetching child categories:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching child categories');
        }
    }

    /**
     * Toggle category active status
     * @param {string} categoryId - Category ID
     * @returns {Promise<Category>}
     */
    async toggleCategoryStatus(categoryId) {
        try {
            const category = await Category.findById(categoryId);
            if (!category) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
            }

            category.isActive = !category.isActive;
            await category.save();

            return category;
        } catch (error) {
            logger.error('Error toggling category status:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error toggling category status');
        }
    }
}

module.exports = new CategoryService(); 
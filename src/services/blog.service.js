const Blog = require("../models/blog.model");
const blogEventService = require("./blogEvent.service");
const logger = require("../features/logger");
const { ApiError } = require('../features/error');
const httpStatus = require("http-status");

/**
 * Create a new blog
 * @param {Object} blogData - The blog data
 * @param {string} adminId - The ID of the admin creating the blog
 * @returns {Promise<Blog>}
 */
exports.createBlog = async (blogData, adminId) => {
    const session = await Blog.startSession();
    session.startTransaction();

    try {
        const blog = new Blog({
            ...blogData,
            admin: adminId
        });
        await blog.save({ session });

        // Publish blog created event
        const publishSuccess = await blogEventService.publishBlogCreated(blog);
        
        if (!publishSuccess) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to publish blog event");
        }

        await session.commitTransaction();
        return blog;
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in createBlog service:", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.BAD_REQUEST, "Error creating blog");
    } finally {
        session.endSession();
    }
};

/**
 * Get all blogs with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<{results: Array, page: number, limit: number, totalPages: number, totalResults: number}>}
 */
exports.getAllBlogs = async (filter = {}, options = {}) => {
    try {
        const { page = 1, limit = 10, sortBy = "createdAt", includeDeleted = false, category } = options;
        
        // Add deletedAt filter if not including deleted blogs
        if (!includeDeleted) {
            filter.deletedAt = null;
        }

        // Add category filter if provided
        if (category) {
            filter.category = category;
        }
        
        const blogs = await Blog.paginate(filter, {
            page,
            limit,
            sort: { [sortBy]: -1 },
            lean: true,
            populate: [
                { path: 'admin', select: 'name email' }
            ]
        });
        
        return blogs;
    } catch (error) {
        logger.error("Error in getAllBlogs service:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching blogs");
    }
};

/**
 * Get a blog by ID
 * @param {string} id - Blog ID
 * @param {boolean} includeDeleted - Whether to include soft-deleted blogs
 * @returns {Promise<Blog>}
 */
exports.getBlogById = async (id, includeDeleted = false) => {
    try {
        const query = Blog.findById(id);
        
        // Add deletedAt filter if not including deleted blogs
        if (!includeDeleted) {
            query.where({ deletedAt: null });
        }
        
        const blog = await query
            .populate('admin', 'name email')
            .lean();
        
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        return blog;
    } catch (error) {
        logger.error(`Error in getBlogById service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching blog");
    }
};

/**
 * Update a blog
 * @param {string} id - Blog ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Blog>}
 */
exports.updateBlog = async (id, updateData) => {
    const session = await Blog.startSession();
    session.startTransaction();

    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true, session }
        );
        
        if (!blog) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        // Publish blog updated event
        const publishSuccess = await blogEventService.publishBlogUpdated(blog);
        
        if (!publishSuccess) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to publish blog event");
        }

        await session.commitTransaction();
        return blog;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error in updateBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating blog");
    } finally {
        session.endSession();
    }
};

/**
 * Delete a blog (soft delete)
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
exports.deleteBlog = async (id) => {
    const session = await Blog.startSession();
    session.startTransaction();

    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: { deletedAt: new Date() } },
            { new: true, runValidators: true, session }
        );
        
        if (!blog) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        // Publish blog deleted event
        const publishSuccess = await blogEventService.publishBlogDeleted(blog._id, blog.author);
        
        if (!publishSuccess) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to publish blog event");
        }

        await session.commitTransaction();
        return blog;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error in deleteBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting blog");
    } finally {
        session.endSession();
    }
};

/**
 * Restore a soft-deleted blog
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
exports.restoreBlog = async (id) => {
    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: { deletedAt: null } },
            { new: true, runValidators: true }
        );
        
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        return blog;
    } catch (error) {
        logger.error(`Error in restoreBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error restoring blog");
    }
};

/**
 * Publish a blog
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
exports.publishBlog = async (id) => {
    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: { status: "published", publishedAt: new Date() } },
            { new: true, runValidators: true }
        );
        
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        // Publish blog published event
        await blogEventService.publishBlogPublished(blog);
        
        return blog;
    } catch (error) {
        logger.error(`Error in publishBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error publishing blog");
    }
};
const Blog = require("../models/blog.model");
const blogEventService = require("./blogEvent.service");
const logger = require("../features/logger");
const { ApiError } = require('../features/error');
const httpStatus = require("http-status");
const mongoose = require('mongoose');

/**
 * Create a new blog
 * @param {Object} blogData - The blog data
 * @param {string} adminId - The ID of the admin creating the blog
 * @returns {Promise<Blog>}
 */
exports.createBlog = async (blogData, adminId) => {
    
    // Check if MongoDB supports transactions (replica set)
    const supportsTransactions = mongoose.connection.db
        ? await isSupportedTransactions()
        : false;

    if (supportsTransactions) {
        // Use transactions if supported
        return createBlogWithTransaction(blogData, adminId);
    } else {
        // Fall back to non-transactional approach
        return createBlogWithoutTransaction(blogData, adminId);
    }
};

/**
 * Check if MongoDB supports transactions
 * @returns {Promise<boolean>}
 */
async function isSupportedTransactions() {
    try {
        // Check if MongoDB is running as replica set
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();
        return serverStatus && serverStatus.process === 'mongod' && 
               serverStatus.repl && serverStatus.repl.setName;
    } catch (error) {
        logger.warn("Failed to check if MongoDB supports transactions:", error);
        return false;
    }
}

/**
 * Create a blog with transaction support
 * @param {Object} blogData - The blog data
 * @param {string} adminId - The ID of the admin creating the blog
 * @returns {Promise<Blog>}
 */
async function createBlogWithTransaction(blogData, adminId) {
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
}

/**
 * Create a blog without transaction support
 * @param {Object} blogData - The blog data
 * @param {string} adminId - The ID of the admin creating the blog
 * @returns {Promise<Blog>}
 */
async function createBlogWithoutTransaction(blogData, adminId) {
    try {
        const blog = new Blog({
            ...blogData,
            admin: adminId
        });
        await blog.save();

        // Publish blog created event
        const publishSuccess = await blogEventService.publishBlogCreated(blog);
        
        if (!publishSuccess) {
            // If event publishing fails, log but don't roll back (can't roll back without transactions)
            logger.warn(`Blog created but event publishing failed for blog ID ${blog._id}`);
        }

        return blog;
    } catch (error) {
        logger.error("Error in createBlog service (non-transactional):", error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.BAD_REQUEST, "Error creating blog");
    }
}

/**
 * Get all blogs with pagination
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise<{results: Array, page: number, limit: number, totalPages: number, totalResults: number}>}
 */
exports.getAllBlogs = async (filter = {}, options = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = "createdAt:desc", // must be a string like "createdAt:desc"
            includeDeleted = false,
            category,
        } = options;
  
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
            sortBy,                         // string expected by paginate
            populate: 'admin',             // string, not object or array
            populateProjection: 'name email', // string projection for populated field
            lean: true,                    // works as boolean or { getters: true }
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
    // Check if MongoDB supports transactions
    const supportsTransactions = mongoose.connection.db
        ? await isSupportedTransactions()
        : false;

    if (supportsTransactions) {
        // Use transactions if supported
        return updateBlogWithTransaction(id, updateData);
    } else {
        // Fall back to non-transactional approach
        return updateBlogWithoutTransaction(id, updateData);
    }
};

/**
 * Update a blog with transaction support
 * @param {string} id - Blog ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Blog>}
 */
async function updateBlogWithTransaction(id, updateData) {
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
}

/**
 * Update a blog without transaction support
 * @param {string} id - Blog ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Blog>}
 */
async function updateBlogWithoutTransaction(id, updateData) {
    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        // Publish blog updated event
        const publishSuccess = await blogEventService.publishBlogUpdated(blog);
        
        if (!publishSuccess) {
            // If event publishing fails, log but don't roll back (can't roll back without transactions)
            logger.warn(`Blog updated but event publishing failed for blog ID ${blog._id}`);
        }

        return blog;
    } catch (error) {
        logger.error(`Error in updateBlog service (non-transactional) for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating blog");
    }
}

/**
 * Delete a blog (soft delete)
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
exports.deleteBlog = async (id) => {
    // Check if MongoDB supports transactions
    const supportsTransactions = mongoose.connection.db
        ? await isSupportedTransactions()
        : false;

    if (supportsTransactions) {
        // Use transactions if supported
        return deleteBlogWithTransaction(id);
    } else {
        // Fall back to non-transactional approach
        return deleteBlogWithoutTransaction(id);
    }
};

/**
 * Delete a blog with transaction support
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
async function deleteBlogWithTransaction(id) {
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
}

/**
 * Delete a blog without transaction support
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
async function deleteBlogWithoutTransaction(id) {
    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: { deletedAt: new Date() } },
            { new: true, runValidators: true }
        );
        
        if (!blog) {
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        // Publish blog deleted event
        const publishSuccess = await blogEventService.publishBlogDeleted(blog._id, blog.author);
        
        if (!publishSuccess) {
            // If event publishing fails, log but don't roll back (can't roll back without transactions)
            logger.warn(`Blog deleted but event publishing failed for blog ID ${blog._id}`);
        }

        return blog;
    } catch (error) {
        logger.error(`Error in deleteBlog service (non-transactional) for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting blog");
    }
}

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
    // Check if MongoDB supports transactions
    const supportsTransactions = mongoose.connection.db
        ? await isSupportedTransactions()
        : false;

    if (supportsTransactions) {
        // Use transactions if supported
        return publishBlogWithTransaction(id);
    } else {
        // Fall back to non-transactional approach
        return publishBlogWithoutTransaction(id);
    }
};

/**
 * Publish a blog with transaction support
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
async function publishBlogWithTransaction(id) {
    const session = await Blog.startSession();
    session.startTransaction();

    try {
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $set: { status: "published", publishedAt: new Date() } },
            { new: true, runValidators: true, session }
        );
        
        if (!blog) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
        }
        
        // Publish blog published event
        const publishSuccess = await blogEventService.publishBlogPublished(blog);
        
        if (!publishSuccess) {
            await session.abortTransaction();
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to publish blog event");
        }

        await session.commitTransaction();
        return blog;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`Error in publishBlog service for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error publishing blog");
    } finally {
        session.endSession();
    }
}

/**
 * Publish a blog without transaction support
 * @param {string} id - Blog ID
 * @returns {Promise<Blog>}
 */
async function publishBlogWithoutTransaction(id) {
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
        const publishSuccess = await blogEventService.publishBlogPublished(blog);
        
        if (!publishSuccess) {
            // If event publishing fails, log but don't roll back (can't roll back without transactions)
            logger.warn(`Blog published but event publishing failed for blog ID ${blog._id}`);
        }
        
        return blog;
    } catch (error) {
        logger.error(`Error in publishBlog service (non-transactional) for ID ${id}:`, error);
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error publishing blog");
    }
}